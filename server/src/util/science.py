from math import isnan
import numpy as np
import pandas as pd
from time import time
from statsmodels.tsa.statespace.sarimax import SARIMAX
from dataclasses import dataclass
from typing import List, Literal, Optional, TYPE_CHECKING
from util.db_utils import MeasurementItemSingular
if TYPE_CHECKING:
    from util.context import Context

MISSING = object()

@dataclass
class DownSampledValue:
    min: Optional[float] = MISSING
    max: Optional[float] = MISSING
    mean: Optional[float] = MISSING
    median: Optional[float] = MISSING

    def to_dict(self):
        return {
            key: (float(getattr(self, key)) if getattr(self, key) is not None else None)
            for key in ("min", "max", "mean", "median")
            if getattr(self, key) is not MISSING
        }


@dataclass
class DownSampledMeasurementItemSingular:
    timestamp: int
    temperature: DownSampledValue
    humidity: DownSampledValue
    pressure: DownSampledValue
    pm10: DownSampledValue
    pm25: DownSampledValue
    pm40: DownSampledValue
    pm100: DownSampledValue
    co2: DownSampledValue
    voc: DownSampledValue
    nox: DownSampledValue
    during_calibration: bool

    def to_dict(self):
        return {
            **{
                key: getattr(self, key).to_dict() for key in ("temperature", "humidity",
                                                             "pressure", "pm10", "pm25", "pm40",
                                                             "pm100", "co2", "voc", "nox")
            },
            "timestamp": self.timestamp,
            "during_calibration": self.during_calibration
        }


# NOTE: interval is in second!
def downSampleMeasurementsTo(
    items: List[MeasurementItemSingular],
    method: Literal["mean", "median", "min", "max"] | List[Literal["mean", "median", "min", "max"]],
    interval: int = 3600
) -> List[DownSampledMeasurementItemSingular]:
    # Check interval limitation
    if interval < 1 or len(items) == 0:
        raise RuntimeError("Incompatible interval or no data")

   # Determine interval for each item based on timestamp
    bucket_timestamps = np.fromiter(
        ((item.timestamp // interval) * interval for item in items),
        dtype=np.int64,
        count=len(items)
    )
    timestamps = np.unique(bucket_timestamps)

    value_arrays = dict()
    ignore_keys = ("during_calibration", "timestamp")
    sample = items[0].to_dict()
    for key in sample.keys():
        if key in ignore_keys: continue
        value_arrays[key] = np.fromiter(
            (getattr(item, key) for item in items),
            dtype=np.float64,
            count=len(items)
        )

    # Perform downsampling operation
    result_arrays = dict()
    methods = [method] if isinstance(method, str) else method
    for value_key in value_arrays.keys():
        result_arrays[value_key] = dict()
        if "mean" in methods:
            result_arrays[value_key]["mean"] = np.array([
                value_arrays[value_key][bucket_timestamps == timestamp].mean()
                for timestamp in timestamps
            ])

        if "median" in methods:
            result_arrays[value_key]["median"] = np.array([
                np.median(value_arrays[value_key][bucket_timestamps == timestamp])
                for timestamp in timestamps
            ])

        if "min" in methods:
            result_arrays[value_key]["min"] = np.array([
                value_arrays[value_key][bucket_timestamps == timestamp].min()
                for timestamp in timestamps
            ])

        if "max" in methods:
            result_arrays[value_key]["max"] = np.array([
                value_arrays[value_key][bucket_timestamps == timestamp].max()
                for timestamp in timestamps
            ])

    # Return the data we wanted
    results: List[DownSampledMeasurementItemSingular] = []
    for i in range(timestamps.shape[0]):
        downsampled_values_fields = dict()
        for value_key in result_arrays.keys():
            single_value_fields = dict()
            for method in methods: # type: ignore
                single_value_fields[method] = result_arrays[value_key][method][i]
                if isnan(single_value_fields[method]):
                    single_value_fields[method] = None
            downsampled_values_fields[value_key] = DownSampledValue(**single_value_fields)
        results.append(DownSampledMeasurementItemSingular(
            timestamp=int(timestamps[i]), during_calibration=False,
            **downsampled_values_fields
        ))

    return results

# MARK: The BEEF
FORECASTING_TERMS = ["temperature", "humidity", "pressure", "PM10", "PM25", "PM40", "PM100", "CO2", "VOC", "NOx"]

def forecast_dayahead_using_SARIMAX(context: "Context", sensor_id: int, term: str, day_count = 1):
    if term not in FORECASTING_TERMS:
        raise RuntimeError(f"Cannot forecast with term: '{term}'")

    print("Performing forecast")

    # Fetch our science data
    with context.database.from_thread() as database:
        sensor = database.get_sensor(sensor_id)
        print("For", sensor)
        if sensor is None:
            raise RuntimeError("Unknown sensor")

        hourly_mean_data = database.unsafe_get_science_hourly_mean(sensor_id, term, 0, int(time()))

    print("Data in memory")

    # Prepare our data
    hourly_data = pd.DataFrame(
        hourly_mean_data.items(),
        columns=["timestamp", "value"]
    )
    hourly_data["timestamp"] = pd.to_datetime(
        hourly_data["timestamp"],
        unit="s",
        utc=True
    ).dt.tz_convert("Europe/Helsinki")
    hourly_data = hourly_data.set_index("timestamp")
    # NOTE: Discard initial data, this only applies to our project
    #       Remove if upcycling!
    hourly_data = hourly_data[
        hourly_data.index >= pd.Timestamp("2026-09-22", tz="Europe/Helsinki")
    ]
    hourly_data = hourly_data.asfreq("h")


    print("Data in proper format")

    # Train the model
    model = SARIMAX(
        hourly_data["value"],
        order=(2, 0, 0),
        seasonal_order=(1, 0, 1, 24),
        trend="c"
    )

    print("Training model")
    model_fit = model.fit(maxiter=500)
    print("mle intervals:", model_fit.mle_retvals) # type: ignore
    
    # Forecast
    print("Conjuring the future")
    predictions = model_fit.forecast(24 * day_count) # type: ignore
    print(f"Forecast done ({len(predictions.keys())})")

    return {
        int(timestamp.timestamp()): float(value)
        for timestamp, value in predictions.items()
    }

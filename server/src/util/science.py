import numpy as np
from dataclasses import dataclass
from typing import List, Literal, Optional
from util.db_utils import MeasurementItemSingular


@dataclass
class DownSampledValue:
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None

    def to_dict(self):
        return {
            key: float(getattr(self, key))
            for key in ("min", "max", "mean", "median")
            if getattr(self, key) is not None
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


def downSampleMeasurementsTo(
    items: List[MeasurementItemSingular],
    method: Literal["mean", "median", "min", "max"] | List[Literal["mean", "median", "min", "max"]],
    interval: int = 360
) -> List[DownSampledMeasurementItemSingular]:
    # Check interval limitation
    if interval < 1 or len(items) == 0:
        print(len(items) == 0, len(items) % interval)
        raise RuntimeError("Incompatible interval or no data")

    # Drop last incomplete interval
    if len(items) % interval != 0:
        usable_items_count = (len(items) // interval) * interval
        items = items[:usable_items_count]

    # Prepare numpy data
    timestamps = np.fromiter(
        (item.timestamp for item in items),
        dtype=np.int64,
        count=len(items)
    ).reshape(-1, interval)[:, 0]

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
        reshaped = value_arrays[value_key].reshape(-1, interval)
        result_arrays[value_key] = dict()
        if "mean" in methods:
            result_arrays[value_key]["mean"] = reshaped.mean(axis=1)
        if "median" in methods:
            result_arrays[value_key]["median"] = reshaped.median(axis=1)
        if "min" in methods:
            result_arrays[value_key]["min"] = reshaped.min(axis=1)
        if "max" in methods:
            result_arrays[value_key]["max"] = reshaped.max(axis=1)

    # Return the data we wanted
    results: List[DownSampledMeasurementItemSingular] = []
    for i in range(timestamps.shape[0]):
        downsampled_values_fields = dict()
        for value_key in result_arrays.keys():
            single_value_fields = dict()
            for method in methods: # type: ignore
                single_value_fields[method] = result_arrays[value_key][method][i]
            downsampled_values_fields[value_key] = DownSampledValue(**single_value_fields)
        results.append(DownSampledMeasurementItemSingular(
            timestamp=int(timestamps[i]), during_calibration=False,
            **downsampled_values_fields
        ))

    return results

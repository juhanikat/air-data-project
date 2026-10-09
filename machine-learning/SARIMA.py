import sqlite3
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pandas.plotting import register_matplotlib_converters
from statsmodels.tsa.stattools import acf, pacf
from statsmodels.tsa.statespace.sarimax import SARIMAX
from time import time

register_matplotlib_converters()


class SARIMA:
    """Load sensor time-series data and fit SARIMA forecasting models.

    The class reads measurements from a SQLite database, converts the raw
    timestamps to a timezone-aware hourly series, and prepares the selected
    sensor column for SARIMA modelling. It is intended for forecasting environmental
    sensor data such as temperature, humidity, or CO2 levels.

    Attributes
    ----------
    database_path (str, optional): Path to the SQLite database containing
        sensor measurements. Defaults to "./data/main.db".
    sensor_id (int, optional): Identifier of the sensor to load data for.
        Defaults to 1.
    column_name (str, optional): Name of the measurement column to model,
        e.g. "temperature" or "CO2". Defaults to "temperature".
    data_start_date (str | None, optional): Optional start date for the
        selected time series, in ISO format such as "YYYY-MM-DD". If
        provided, data earlier than this date are excluded.

    Methods
    -------
    load_new_data():
        Change the sensor or column of the data. Change the class attribute `sensor_id` or
        `column_name` and then call this function.

    show_plot():
        Display the current Matplotlib figures.

    plot_data():
        Plot the hourly sensor data and annotate daily/monthly boundaries for easier inspection.

    plot_ACF_and_PACF(number_of_lags=36):
        Calculate and plot the autocorrelation and partial autocorrelation functions.

    make_SARIMA_predictions(train_test_split_date, SARIMA_order, SARIMA_seasonal_order):
        Divide the data to training and testing sets. Fit a SARIMA model to the training data and print a summary.
        Create predictions and compare them to the testing data in a figure. Print residual diagnostics.
    """

    def __init__(
        self,
        database_path="./data/main.db",
        sensor_id=1,
        column_name="temperature",
        data_start_date: str | None = None,
    ):
        self.database_path = database_path
        self.sensor_id = sensor_id
        self.column_name = column_name
        self.data_start_date = data_start_date
        self.__time_zone = "Europe/Helsinki"  # Probably does no need changing

        self.load_new_data()

    def load_new_data(self):
        """Loads data from the database."""
        data = self.__read_data(self.database_path, self.sensor_id, self.column_name)
        data = self.__preprocess_data(data, self.column_name, self.data_start_date)
        self.data = data

    def __read_data(self, database_path: str, sensor_id: int, column_name: str):
        """Reads sensor data from the SQLite database and returns a pandas Series.

        Args:
            database_path (str): Path to the SQLite database file.
            sensor_id (int): ID of the sensor.
            column_name (str): Name of the column to read (e.g. "CO2").
        Returns:
            pandas.dataframe: A dataframe with unix timestamps and the specified data column.
        """
        conn = sqlite3.connect(database_path)
        # columns = (
        #     "temperature, humidity, pressure, PM10, PM25, PM40, PM100, CO2, VOC, NOx "
        # )
        columns = [
            "temperature",
            "humidity",
            "pressure",
            "PM10",
            "PM25",
            "PM40",
            "PM100",
            "CO2",
            "VOC",
            "NOx",
        ]
        if column_name not in columns:
            print(f"ERROR: column {column_name} does not exists")
            return

        query = f"""
            SELECT measurement_timestamp, {column_name}
            FROM measurements
            WHERE sensor_id = ?
            ORDER BY measurement_timestamp
        """
        df = pd.read_sql_query(query, conn, params=(sensor_id,))
        conn.close()
        return df

    def __preprocess_data(
        self,
        data: pd.DataFrame,
        column_name: str,
        data_start_date: str = None,
    ):
        """Preprocesses the data by converting UNIX timestamps to datetime objects and downsampling
        to hourly means. Optionally remove the data before the specified `data_start_date`.

        Args:
            df (pandas.DataFrame): DataFrame containing the data.
            column_name (str): Name of the column to process (e.g. "temperature").
            data_start_date (str): Date to start the data from. Format: "YYYY-MM-DD".
            time_zone (str): Time zone for the datetime index (e.g. "Europe/Helsinki").

        Returns:
            pandas.Series: Hourly mean data indexed by timezone-aware datetime."""

        # Convert unix timestamps to a timezone-aware datetime index

        # 1. Convert Unix timestamps from UTC+3 to UTC+0 and create pandas datetime objects.
        # Save datetime objects to the column 'time'.
        data["time"] = pd.to_datetime(data["measurement_timestamp"], unit="s", utc=True)
        # 2 Convert the pandas datetime ojects in UTC+0 time zone back to UTC+3.
        data["time"] = data["time"].dt.tz_convert(self.__time_zone)
        # Make the datetime objects the indices of the series
        all_data = data.set_index("time")[column_name]

        # Downsample to hourly mean
        hourly_data = all_data.resample("1h").mean()
        # Remove data before the specified date
        if data_start_date:
            hourly_data = hourly_data[
                hourly_data.index >= pd.Timestamp(data_start_date, tz=self.__time_zone)
            ]
        # Check for gaps in data
        number_of_missing_hours = hourly_data.isna().sum()
        if number_of_missing_hours > 0:
            print(f"Warning: {number_of_missing_hours} missing hours")
            print(
                "Total number of timestamps-> Number of hourly means after downsampling"
            )
            print(len(all_data), "->", len(hourly_data))

        return hourly_data

    def show_plot(self):
        """Show all figures"""
        plt.show()

    def plot_data(self):
        """Plots the hourly mean data with vertical lines marking the start of days and shaded areas for weekends.
        Call `plt.show()` after this function to display the plot.
        Args:
            temp_hourly (pandas.Series): Hourly mean data indexed by timezone-aware datetime.
        Returns:
            None"""
        data = self.data
        day_starts = pd.date_range(
            start=data.index[0].ceil("D"),  # first midnight after the data starts
            end=data.index[-1],
            freq="D",
        )
        plt.figure(figsize=(20, 5))
        plt.plot(data)
        # Add vertical lines to mark the start of days
        for d in day_starts:
            plt.axvline(d, color="gray", linestyle="--", linewidth=0.8, alpha=0.7)
        # Add shaded areas for weekends
        for d in day_starts:
            if d.dayofweek >= 5:  # 5 = Saturday, 6 = Sunday
                plt.axvspan(d, d + pd.Timedelta(days=1), color="orange", alpha=0.15)
        plt.title("Hourly mean data")

    def plot_ACF_and_PACF(self, number_of_lags: int = 36):
        """Calculates, plots and returns the ACF and PACF of the given time series.

        Args:
            dataSeries (pandas.Series): Time series data.
            number_of_lags (int): Number of lags to calculate for ACF and PACF.
        Returns:
            tuple: ACF and PACF values in numpy arrays."""
        data = self.data
        # Calculate ACF
        acf_vals = acf(data, nlags=number_of_lags)
        plt.figure()
        plt.bar(range(number_of_lags), acf_vals[:number_of_lags])
        plt.title("ACF")
        # Calculate PACF
        pacf_vals = pacf(data, nlags=number_of_lags)
        plt.figure()
        plt.bar(range(number_of_lags), pacf_vals[:number_of_lags])
        plt.title("PACF")

        return acf_vals, pacf_vals

    def make_SARIMA_predictions(
        self,
        SARIMA_order: tuple,
        SARIMA_seasonal_order: tuple,
        # train_test_split_date: str,
    ):
        """Divides the data into training and testing sets, fits a SARIMA model, makes predictions, and plots the results.

        Args:
            data (pandas.Series): Time series data indexed by timezone-aware datetime.
            train_test_split_date (str): First day that is not included in the training set and is included in the testing set. Format: "YYYY-MM-DD".
            SARIMA_order (tuple): Order of the SARIMA model: (p,d,q).
            SARIMA_seasonal_order (tuple): Seasonal order of the SARIMA model: (p,d,q,m).
        Returns:
            None"""
        data = self.data

        # Divide data into training and testing sets
        train_test_split_date = pd.Timestamp(
            "2026-10-06", tz=self.__time_zone
        )  # first day NOT in training
        train_data = data[data.index < train_test_split_date]
        test_data = data[(data.index >= train_test_split_date)]

        # Create the SARIMA model

        # Define the model
        model = SARIMAX(
            train_data, order=SARIMA_order, seasonal_order=SARIMA_seasonal_order
        )

        # Fit the model
        start = time()
        model_fit = model.fit()
        end = time()
        print("Fitting time:", end - start)

        # Summary of the model
        print(model_fit.summary())

        # get the predictions and residuals
        prediction_period = len(test_data)
        print(f"Predicting {prediction_period} data points")
        predictions = model_fit.forecast(prediction_period)
        predictions = pd.Series(predictions, index=test_data.index)

        residuals = test_data - predictions

        # Plot Resiuals
        plt.figure(figsize=(10, 4))
        plt.plot(residuals)
        plt.axhline(0, linestyle="--", color="k")
        plt.title("Residuals from SARIMA Model", fontsize=20)
        plt.ylabel("Error", fontsize=16)

        # Plot predictions vs actual data
        plt.figure(figsize=(10, 4))
        plt.plot(data[-24:])  # Edit this manually
        plt.plot(predictions)
        plt.legend(("Data", "Predictions"), fontsize=16)

        print(
            "Mean Absolute Percent Error:",
            round(np.mean(abs(residuals / test_data)), 4),
        )
        print("Root Mean Squared Error:", np.sqrt(np.mean(residuals**2)))


l = SARIMA(sensor_id=2, column_name="CO2")
l.plot_data()
# l.plot_ACF_and_PACF()
l.make_SARIMA_predictions((2, 0, 0), (1, 0, 1, 24))
l.show_plot()

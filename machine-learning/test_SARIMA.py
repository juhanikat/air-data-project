import sqlite3
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pandas.plotting import register_matplotlib_converters
from statsmodels.tsa.stattools import acf, pacf
from statsmodels.tsa.statespace.sarimax import SARIMAX
from time import time
from datetime import timedelta

register_matplotlib_converters()

# Print info about the data as it is being processed and about new data created
PRINT = False
# Calculate also the rolling forecast origin predictions. May improve the results.
# Note: takes some time.
LETS_ROLL = True


# 1. Read from the database
conn = sqlite3.connect("./data/main.db")  # path to your .db file
query = """
    SELECT measurement_timestamp, temperature
    FROM measurements
    WHERE sensor_id = 1
    ORDER BY measurement_timestamp
"""
df = pd.read_sql_query(query, conn)
conn.close()


# 2. Convert unix timestamps to a timezone-aware datetime index
# Convert Unix timestamps from UTC+3 to UTC+0 and create pandas datetime objects.
# Save datetime objects to the column 'time'.
time_zone = "Europe/Helsinki"
df["time"] = pd.to_datetime(df["measurement_timestamp"], unit="s", utc=True)
# 2 Convert the pandas datetime ojects in UTC+0 time zone back to UTC+3.
df["time"] = df["time"].dt.tz_convert(time_zone)
# Make the datetime objects the indices of the series
temp = df.set_index("time")["temperature"]


# 3. Downsample to hourly mean
hourly_data = temp.resample("1h").mean()


# Remove first three days
hourly_data = hourly_data[hourly_data.index >= pd.Timestamp("2026-9-22", tz=time_zone)]


# 4. Check for gaps in data
print("\nNumber_of_temps-> Number_of_hourly_means")
print(len(temp), "->", len(hourly_data))
print("Missing hours:", hourly_data.isna().sum())


# Plot data
plt.figure(figsize=(20, 5))
plt.plot(hourly_data)
# Add vertical lines to mark the start of days
day_starts = pd.date_range(
    start=hourly_data.index[0].ceil("D"),  # first midnight after the data starts
    end=hourly_data.index[-1],
    freq="D",
)
for d in day_starts:
    plt.axvline(d, color="gray", linestyle="--", linewidth=0.8, alpha=0.7)
# Add shaded areas on weekends
for d in day_starts:
    if d.dayofweek >= 5:  # 5 = Saturday, 6 = Sunday
        plt.axvspan(d, d + pd.Timedelta(days=1), color="orange", alpha=0.15)
plt.title("Hourly mean data")


# Calculate ACF
acf_vals = acf(hourly_data, nlags=36)
num_lags = 36
plt.figure()
plt.bar(range(num_lags), acf_vals[:num_lags])
plt.title("ACF")


# Calculate PACF
pacf_vals = pacf(hourly_data, nlags=36)
num_lags = 36
plt.figure()
plt.bar(range(num_lags), pacf_vals[:num_lags])
plt.title("PACF")


# Divide data into training and testing sets
train_end = pd.Timestamp("2026-10-06", tz=time_zone)  # first day NOT in training
test_end = pd.Timestamp("2026-10-07", tz=time_zone)  # first day NOT in test

train_data = hourly_data[hourly_data.index < train_end]
test_data = hourly_data[
    (hourly_data.index >= train_end) & (hourly_data.index < test_end)
]


# Create the SARIMA model

# Define the orders of the SARIMA model
my_order = (2, 0, 0)
my_seasonal_order = (1, 0, 1, 24)

# Define the model
model = SARIMAX(train_data, order=my_order, seasonal_order=my_seasonal_order)

# Fit the model
start = time()
model_fit = model.fit()
end = time()
print("Fitting time:", end - start)

# Summary of the model
print(model_fit.summary())

############################################
### Now, let's do the actual predictions ###
############################################

# Get the predictions

prediction_period = len(test_data)
print(f"Predicting {prediction_period} data points")
predictions = model_fit.forecast(prediction_period)
predictions = pd.Series(predictions, index=test_data.index)

# Plot predictions vs actual data
plt.figure(figsize=(10, 4))
plt.plot(hourly_data[-24:])  # Edit this manually
plt.plot(predictions)
plt.title("SARIMA predictions", fontsize=20)
plt.legend(("Data", "Predictions"), fontsize=16)

### Yay! predictions done ###


# Get the residuals
residuals = test_data - predictions

# Plot Resiuals
plt.figure(figsize=(10, 4))
plt.plot(residuals)
plt.axhline(0, linestyle="--", color="k")
plt.title("Residuals from SARIMA Model", fontsize=20)
plt.ylabel("Error", fontsize=16)

# plt.show()

print("Mean Absolute Percent Error:", round(np.mean(abs(residuals / test_data)), 4))
print("Root Mean Squared Error:", np.sqrt(np.mean(residuals**2)))


# Try improving the results using the rolling forecast origin technique.
if LETS_ROLL:
    rolling_predictions = test_data.copy()
    for train_end in test_data.index:
        train_data = hourly_data[: train_end - timedelta(days=1)]
        model = SARIMAX(train_data, order=my_order, seasonal_order=my_seasonal_order)
        model_fit = model.fit()

        pred = model_fit.forecast()
        rolling_predictions[train_end] = pred

    rolling_residuals = test_data - rolling_predictions

    rolling_residuals = test_data - rolling_predictions

    plt.figure(figsize=(10, 4))
    plt.plot(rolling_residuals)
    plt.axhline(0, linestyle="--", color="k")
    plt.title("Rolling Forecast Residuals from SARIMA Model", fontsize=20)
    plt.ylabel("Error", fontsize=16)

    plt.figure(figsize=(10, 4))
    plt.plot(hourly_data[-24:])  # Edit this manually
    plt.plot(rolling_predictions)
    plt.title("SARIMA predictions Rolling origin ", fontsize=20)
    plt.legend(("Data", "Predictions"), fontsize=16)

    plt.show()

    print(
        "Mean Absolute Percent Error:",
        round(np.mean(abs(rolling_residuals / test_data)), 4),
    )
    print("Root Mean Squared Error:", np.sqrt(np.mean(rolling_residuals**2)))


# Prrrrrrrrrrrrrint
if PRINT:
    print("\ndf.head()")
    print(df.head())
    print("\ndf.info()")
    print(df.info())
    print("\ntemp.head()")
    print(temp.head())
    print("\ntemp.info()")
    print(temp.info())
    print("\nhourly_data.head()")
    print(hourly_data.head())
    print("\nhourly_data.info()")
    print(hourly_data.info())
    print("\nACF vals")
    print(acf_vals)
    print("\nPACF vals")
    print(pacf_vals)
    print("\ntrain_data()")
    print(train_data.head())
    print("size:", train_data.size)
    print("\ntest_data()")
    print(test_data.head())
    print("size:", test_data.size)

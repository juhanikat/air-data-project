# Machine learning

This directory contains the code for the machine learning models used in the project. The code is used to test the models and tune their parameters.

- `SARIMA.py` defines a class that makes it easier to test the models and tune their parameters.
- `test_SARIMA.py` is example code that demonstrates how to fit the SARIMA model, evaluate it with a rolling forecast origin, and plot the results.

## Installation

These instructions assume you have conda installed. In the `machine-learning` directory run:

```bash
conda env create -f environment.yml
conda activate myenv
```

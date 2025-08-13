import numpy as np
from scipy.stats import norm

class Black_Scholes:

    def __init__(self, stock_price, exercise_price, interest_rate, time, deviation, use_newton):
        self.stock_price = stock_price
        self.exercise_price = exercise_price
        self.interest_rate = interest_rate
        self.time = time
        self.deviation = deviation




    def black_scholes_formula(self):
     
        d1 = (np.log(self.stock_price/self.exercise_price) + (self.interest_rate + self.deviation**2 / 2) * self.time) / (self.deviation * np.sqrt(self.time))
        d2 = (np.log(self.stock_price/self.exercise_price) + (self.interest_rate - self.deviation**2 / 2) * self.time) / (self.deviation * np.sqrt(self.time))
        get = self.stock_price * norm.cdf(d1)
        pay = self.exercise_price * norm.cdf(d2) * np.exp(self.time * self.interest_rate)

        call = np.round(get - pay, 2)
        put = np.round(self.exercise_price * norm.cdf(-d2) * np.exp(self.time * self.interest_rate) - self.stock_price * norm.cdf(-d1),2)
        
        return call, put
    
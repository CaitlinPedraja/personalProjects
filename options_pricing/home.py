import streamlit as st
import numpy as np
import black_scholes
import matplotlib.pyplot as plt
st.set_page_config( page_icon=":eyeglasses:")


call, put = None, None



st.title("Black-Scholes Formula Output:")

st.sidebar.markdown("## Select Inputs")
stock_price = st.sidebar.number_input('Stock Price (S)', min_value=1.0, max_value=1000.0, value=100.0, step=1.0)
exercise_price = st.sidebar.number_input('Exercise Price (X)', min_value=1.0, max_value=1000.0, value=100.0, step=1.0)
interest_rate = st.sidebar.slider('Interest Rate (r)', 0.0, 0.2, 0.05)
time = st.sidebar.slider('Time to Mature (years)', 0.01, 5.0, 1.0)
deviation = st.sidebar.slider('Standard Deviation (σ)', 0.01, 1.0, 0.2)


test = black_scholes.Black_Scholes(stock_price, exercise_price, interest_rate, time, deviation)
call, put = test.black_scholes_formula()

col1, col2 = st.columns(2)
with col1:
    st.markdown(f"<h2>Call Option Price: <b>${call:.2f}</b></h2>", unsafe_allow_html=True)
with col2:
    st.markdown(f"<h2>Put Option Price: <b>${put:.2f}</b></h2>", unsafe_allow_html=True)



strike_prices = np.linspace(stock_price * 0.5, stock_price * 1.5, 100)
call_prices = []
put_prices = []

for x in strike_prices:
    bs = black_scholes.Black_Scholes(stock_price, x, interest_rate, time, deviation)
    call_val, put_val = bs.black_scholes_formula()
    call_prices.append(call_val)
    put_prices.append(put_val)

fig, ax = plt.subplots()
ax.plot(strike_prices, call_prices, label='Call Price')
ax.plot(strike_prices, put_prices, label='Put Price')
ax.set_xlabel('Strike Price')
ax.set_ylabel('Option Price')
ax.set_title('Option Price vs Strike Price')
ax.legend()

# Calculate equilibrium price (where call and put prices are equal)
equilibrium_idx = np.argmin(np.abs(np.array(call_prices) - np.array(put_prices)))
equilibrium_strike = strike_prices[equilibrium_idx]
equilibrium_price = call_prices[equilibrium_idx]

# Mark equilibrium price on the plot
ax.axvline(equilibrium_strike, color='red', linestyle='--', label='Equilibrium Strike')

ax.annotate(np.round(equilibrium_strike,2), 
            xy=(equilibrium_strike, equilibrium_price), 
            xytext=(equilibrium_strike+ 4, equilibrium_price ),
            fontsize=12, color='red')

st.pyplot(fig)

spot_range = np.linspace(stock_price * 0.5, stock_price * 1.5, 50)
vol_range = np.linspace(0.01, 1.0, 50)
call_matrix = np.zeros((len(spot_range), len(vol_range)))
put_matrix = np.zeros((len(spot_range), len(vol_range)))

for i, s in enumerate(spot_range):
    for j, sigma in enumerate(vol_range):
        bs = black_scholes.Black_Scholes(s, exercise_price, interest_rate, time, sigma)
        call_val, put_val = bs.black_scholes_formula()
        call_matrix[i, j] = call_val
        put_matrix[i, j] = put_val

fig2, ax2 = plt.subplots()
c = ax2.imshow(call_matrix, extent=[vol_range[0], vol_range[-1], spot_range[0], spot_range[-1]],
               origin='lower', aspect='auto', cmap='plasma')
ax2.set_xlabel('Volatility (σ)')
ax2.set_ylabel('Spot Price (S)')
c.set_cmap('RdYlGn')
ax2.set_title('Call Option Price Heatmap')
fig2.colorbar(c, ax=ax2, label='Call Price')
st.pyplot(fig2)

fig3, ax3 = plt.subplots()
c2 = ax3.imshow(put_matrix, extent=[vol_range[0], vol_range[-1], spot_range[0], spot_range[-1]],
                origin='lower', aspect='auto', cmap='viridis')
ax3.set_xlabel('Volatility (σ)')
ax3.set_ylabel('Spot Price (S)')
ax3.set_title('Put Option Price Heatmap')
c2.set_cmap('RdYlGn')
fig3.colorbar(c2, ax=ax3, label='Put Price')
st.pyplot(fig3)
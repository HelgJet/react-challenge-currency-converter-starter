// `https://api.frankfurter.app/latest?amount=100&from=EUR&to=USD`

import { useState, useEffect } from "react";

const API_URL = "https://api.frankfurter.app";

export default function App() {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleSetAmount(e) {
    const value = e.target.value;
    setAmount(value === "" ? "" : Number(value));
  }

  useEffect(() => {
    const controller = new AbortController();
    const fetchCurrencies = async () => {
      try {
        const res = await fetch(`${API_URL}/currencies`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Failed to fetch available currencies");
        }

        const data = await res.json();
        setCurrencies(Object.keys(data));
      } catch (err) {
        console.log("Currencies fetch error:", err);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!amount || fromCurrency === toCurrency) return;
    const controller = new AbortController();
    async function getCurrencyData() {
      setResult({ rates: {} });
      try {
        setIsLoading(true);
        const res = await fetch(
          `${API_URL}/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`,
          { signal: controller.signal }
        );

        if (!res.ok)
          throw new Error("Somthing went wrong with fetching currencies");

        const data = await res.json();

        setResult({
          rates: data.rates,
          date: data.date,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
    getCurrencyData();

    return () => controller.abort();
  }, [amount, fromCurrency, toCurrency]);

  const renderCurrencyOptions = () => {
    if (isLoadingCurrencies) {
      return <option>Loading currencies...</option>;
    }

    if (error) {
      return <option>Failed to load currencies</option>;
    }

    return currencies.map((currency) => (
      <option key={currency} value={currency}>
        {currency}
      </option>
    ));
  };

  const outputValue = result?.rates?.[toCurrency] || 0;
  const showResult =
    !isLoading && amount && fromCurrency !== toCurrency && outputValue > 0;
  return (
    <div>
      <input
        type="number"
        placeholder="Amount"
        min="0"
        disabled={isLoadingCurrencies}
        value={amount}
        onChange={handleSetAmount}
      />
      <select
        value={fromCurrency}
        onChange={(e) => setFromCurrency(e.target.value)}
        disabled={isLoading || isLoadingCurrencies}
      >
        {renderCurrencyOptions()}
      </select>
      <span>→</span>
      <select
        value={toCurrency}
        onChange={(e) => setToCurrency(e.target.value)}
        disabled={isLoading || isLoadingCurrencies}
      >
        {renderCurrencyOptions()}
      </select>
      <div>
        {isLoadingCurrencies ? (
          <Loader message="Loading available currencies..." />
        ) : isLoading ? (
          <Loader />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : !amount ? (
          <InfoMessage message="Please enter an amount to convert" />
        ) : fromCurrency === toCurrency ? (
          <InfoMessage message="Please select different currencies" />
        ) : showResult ? (
          <Result
            amount={amount}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            convertedAmount={outputValue}
            date={result.date}
          />
        ) : null}
      </div>
    </div>
  );
}

function Loader({ message = "Loading..." }) {
  return <div className="loader">{message}</div>;
}

function InfoMessage({ message }) {
  return <div className="info">ℹ️ {message}</div>;
}

function ErrorMessage({ message }) {
  return <div className="error">⚠️ {message}</div>;
}

function Result({ amount, fromCurrency, toCurrency, convertedAmount, date }) {
  return (
    <div>
      <p>
        <span>💶</span>
        {amount} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}
      </p>
      {date && (
        <p className="date">
          Exchange rate date: {new Date(date).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

import { useState, useContext } from "react";
import Papa from "papaparse";
import { DataContext, CURRENCIES } from "../context/AppContext";
import { demoData } from "../data/demoData";
import { format } from "date-fns";
import { useModal } from "../context/ModalContext";

// =========================
// REUSABLE SECTION COMPONENT
// =========================
const Section = ({
  title,
  subtitle,
  children,
  right,
}) => (
  <div className="w-full rounded-[24px] border border-[#222] bg-[#0B0B0B] p-6 md:p-8 transition-all duration-300 hover:border-[#FF6B00]/30 hover:shadow-[0_0_20px_rgba(255,107,0,0.05)]">

    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

      <div className="space-y-2">
        <h2 className="text-[28px] font-black uppercase tracking-[0.22em] text-[#FF6B00]">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      {right}
    </div>

    {children}
  </div>
);

export default function Settings() {
  const {
    transactions,
    setTransactions,
    currency,
    updateCurrency,
  } = useContext(DataContext);

  const { showModal } = useModal();

  const [showManualEntry, setShowManualEntry] = useState(true);
  const [importMode, setImportMode] = useState("replace");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [manualTransaction, setManualTransaction] = useState({
    Date: format(new Date(), "dd/MM/yyyy"),
    Description: "",
    Amount: "",
  });

  // =========================
  // CSV IMPORT (FIXED + SAFE)
  // =========================
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        const parsedData = (results.data || []).filter(
          (row) =>
            row?.Date &&
            row?.Description &&
            row?.Amount
        );

        if (parsedData.length === 0) {
          setLoading(false);
          showModal({
            type: "alert",
            message: "The uploaded CSV is empty or invalid.",
          });
          return;
        }

        const requiredKeys = ["Date", "Description", "Amount", "Category"];
        const hasAllKeys = requiredKeys.every(
          (key) => key in parsedData[0]
        );

        if (!hasAllKeys) {
          setLoading(false);
          showModal({
            type: "alert",
            message:
              "Invalid CSV format. Required: Date, Description, Amount, Category.",
          });
          return;
        }

        const normalizedData = parsedData.map((item) => ({
          Date: item.Date,
          Description: item.Description,
          Amount: item.Amount,
          Category: item.Category,
          Currency: currency,
        }));

        const updatedData =
          importMode === "append"
            ? [...(transactions || []), ...normalizedData]
            : normalizedData;

        setTransactions(updatedData);

        localStorage.setItem(
          "transactions",
          JSON.stringify(updatedData)
        );

        setLoading(false);
        setSuccessMessage("CSV Imported Successfully!");

        setTimeout(() => setSuccessMessage(""), 3000);
      },

      error: () => {
        setLoading(false);
        showModal({
          type: "alert",
          message: "Failed to parse CSV file.",
        });
      },
    });

    e.target.value = "";
  };

  // =========================
  // MANUAL ENTRY (SAFE DATE FIX)
  // =========================
  const handleManualSubmit = (e) => {
    e.preventDefault();

    if (
      !manualTransaction.Date ||
      !manualTransaction.Description ||
      !manualTransaction.Amount
    ) {
      showModal({
        type: "alert",
        message: "Please fill all fields",
      });
      return;
    }

    const updatedTransactions = [
      ...(transactions || []),
      {
        ...manualTransaction,
        Currency: currency,
        Category: "Uncategorized",
      },
    ];

    setTransactions(updatedTransactions);

    localStorage.setItem(
      "transactions",
      JSON.stringify(updatedTransactions)
    );

    setManualTransaction({
      Date: format(new Date(), "dd/MM/yyyy"),
      Description: "",
      Amount: "",
    });

    setSuccessMessage("Transaction Added!");

    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const clearAllData = () => {
    showModal({
      type: "confirm",
      message: "Are you sure you want to clear all data?",
      onConfirm: () => {
        setTransactions([]);
        localStorage.removeItem("transactions");

        setSuccessMessage("All Data Cleared!");
        setTimeout(() => setSuccessMessage(""), 3000);
      },
    });
  };

  return (
    <div className="w-full space-y-6">

      {successMessage && (
        <div className="rounded-2xl border border-[#FF6B00]/30 bg-[#111] px-5 py-4 text-sm font-bold tracking-wide text-[#FF6B00] uppercase">
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-2">
          <span className="loading loading-spinner loading-lg text-[#FF6B00]" />
        </div>
      )}

      {/* DATA SOURCE */}
      <Section
        title="Data Source"
        subtitle="Upload CSV or load demo financial data"
        right={
          <div className="flex overflow-hidden rounded-xl border border-[#222] self-start">

            {["replace", "append"].map((mode) => (
              <button
                key={mode}
                onClick={() => setImportMode(mode)}
                className={`h-[42px] px-5 text-xs font-bold uppercase transition-all ${
                  importMode === mode
                    ? "bg-[#FF6B00] text-black"
                    : "bg-[#111] text-gray-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        }
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">

          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="file-input h-[48px] w-full rounded-xl border border-[#222] bg-[#111] text-white"
          />

          <button
            onClick={() => {
              const updated =
                importMode === "append"
                  ? [...(transactions || []), ...demoData]
                  : demoData;

              setTransactions(updated);
              localStorage.setItem(
                "transactions",
                JSON.stringify(updated)
              );

              setSuccessMessage("Demo Data Loaded!");
              setTimeout(() => setSuccessMessage(""), 3000);
            }}
            className="h-[48px] min-w-[240px] rounded-xl bg-[#FF6B00] px-8 text-sm font-black uppercase text-black"
          >
            Load Demo Data
          </button>
        </div>
      </Section>

      {/* MANUAL ENTRY (UI UNCHANGED) */}
      <Section
        title="Manual Entry"
        subtitle="Add transactions manually"
        right={
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="rounded-xl border border-[#222] px-5 py-2 text-sm font-semibold uppercase text-gray-400"
          >
            {showManualEntry ? "Hide Form" : "Show Form"}
          </button>
        }
      >
        {showManualEntry && (
          <form onSubmit={handleManualSubmit} className="space-y-6">

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

              {/* DATE (SAFE FIXED) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Date
                </label>

                <input
                  type="date"
                  required
                  value={
                    manualTransaction.Date
                      ? format(
                          new Date(
                            manualTransaction.Date.split("/").reverse().join("-")
                          ),
                          "yyyy-MM-dd"
                        )
                      : ""
                  }
                  onChange={(e) => {
                    if (!e.target.value) return;

                    const d = new Date(e.target.value);
                    if (isNaN(d.getTime())) return;

                    setManualTransaction({
                      ...manualTransaction,
                      Date: format(d, "dd/MM/yyyy"),
                    });
                  }}
                  className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
                />
              </div>

              {/* DESCRIPTION (UNCHANGED UI) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Description
                </label>

                <input
                  type="text"
                  required
                  placeholder="Enter description"
                  value={manualTransaction.Description}
                  onChange={(e) =>
                    setManualTransaction({
                      ...manualTransaction,
                      Description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
                />
              </div>

              {/* AMOUNT (UNCHANGED UI) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Amount
                </label>

                <input
                  type="number"
                  required
                  placeholder="Enter amount"
                  value={manualTransaction.Amount}
                  onChange={(e) =>
                    setManualTransaction({
                      ...manualTransaction,
                      Amount: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-[#FF6B00] px-7 py-3 font-black uppercase text-black"
              >
                Add Transaction
              </button>

              <button
                type="button"
                onClick={clearAllData}
                className="rounded-xl border border-red-500/40 px-7 py-3 font-black uppercase text-red-400"
              >
                Clear Data
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* CURRENCY */}
      <Section title="Currency Settings">
        <select
          value={currency?.code || ""}
          onChange={(e) => {
            const selected = CURRENCIES.find(
              (c) => c.code === e.target.value
            );
            if (selected) updateCurrency(selected);
          }}
          className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} — {c.name}
            </option>
          ))}
        </select>
      </Section>

      {/* OVERVIEW */}
      {transactions?.length > 0 && (
        <Section title="Data Overview">
          Total Transactions: {transactions.length}
        </Section>
      )}
    </div>
  );
}
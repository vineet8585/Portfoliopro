import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  LockKeyhole,
  X,
} from "lucide-react";
import {
  assetFor,
  formatCurrency,
  type OrderSide,
  type OrderType,
  type Position,
} from "./types";
import type { SubmitPaperOrder } from "./usePaperPortfolio";

type Props = {
  open: boolean;
  symbol: string;
  cash: number;
  positions: Position[];
  onClose: () => void;
  onSubmit: (input: SubmitPaperOrder) => {
    ok: boolean;
    message: string;
    order?: { id: string; status: string; price: number };
  };
};

export default function OrderDialog({
  open,
  symbol,
  cash,
  positions,
  onClose,
  onSubmit,
}: Props) {
  const asset = assetFor(symbol);
  const [side, setSide] = useState<OrderSide>("Buy");
  const [type, setType] = useState<OrderType>("Market");
  const [sharesText, setSharesText] = useState("10");
  const [limitText, setLimitText] = useState(asset.price.toFixed(2));
  const [step, setStep] = useState<"edit" | "review" | "done">("edit");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{
    id: string;
    status: string;
    price: number;
    message: string;
  } | null>(null);
  const shares = Number(sharesText);
  const limitPrice = Number(limitText);
  const holding = positions.find(position => position.symbol === symbol);
  const price =
    type === "Limit" && Number.isFinite(limitPrice) && limitPrice > 0
      ? limitPrice
      : asset.price;
  const estimated = useMemo(
    () => (Number.isFinite(shares) ? shares * price : 0),
    [shares, price]
  );

  useEffect(() => {
    if (open) {
      setSide("Buy");
      setType("Market");
      setSharesText("10");
      setLimitText(asset.price.toFixed(2));
      setStep("edit");
      setError("");
      setReceipt(null);
    }
  }, [open, symbol, asset.price]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const validate = () => {
    if (!Number.isFinite(shares) || shares <= 0)
      return "Enter a share quantity greater than zero.";
    if (!Number.isInteger(shares))
      return "Fractional shares are not enabled in this demo ticket.";
    if (type === "Limit" && (!Number.isFinite(limitPrice) || limitPrice <= 0))
      return "Enter a valid limit price.";
    if (side === "Sell" && (!holding || shares > holding.shares))
      return `You have ${holding?.shares ?? 0} shares available in this demo portfolio.`;
    const isMarketable =
      type === "Market" ||
      (side === "Buy" ? price >= asset.price : price <= asset.price);
    if (side === "Buy" && isMarketable && estimated > cash)
      return "Not enough demo cash for this simulated order.";
    return "";
  };

  const toReview = () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setStep("review");
  };

  const confirm = () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      setStep("edit");
      return;
    }
    const result = onSubmit({
      side,
      type,
      symbol,
      shares,
      limitPrice: type === "Limit" ? limitPrice : undefined,
    });
    if (!result.ok || !result.order) {
      setError(result.message);
      setStep("edit");
      return;
    }
    setReceipt({ ...result.order, message: result.message });
    setStep("done");
  };

  return (
    <div
      className="modal-scrim"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="order-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
      >
        <div className="dialog-topline">
          <div>
            <div className="eyebrow">PAPER ORDER TICKET</div>
            <h2 id="order-title">
              {step === "done"
                ? "Order activity"
                : step === "review"
                  ? "Review paper order"
                  : "Place a trade"}
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close order ticket"
          >
            <X size={18} />
          </button>
        </div>
        {step === "done" && receipt ? (
          <div className="order-success">
            <span className="success-icon">
              <Check size={22} />
            </span>
            <h3>
              {receipt.status === "Filled"
                ? "Paper order filled"
                : "Limit order submitted"}
            </h3>
            <p>{receipt.message}</p>
            <div className="receipt-card">
              <div>
                <span>Order ID</span>
                <strong>{receipt.id}</strong>
              </div>
              <div>
                <span>Symbol</span>
                <strong>{symbol}</strong>
              </div>
              <div>
                <span>Demo price</span>
                <strong>{formatCurrency(receipt.price)}</strong>
              </div>
              <div>
                <span>Mode</span>
                <strong>Paper trading</strong>
              </div>
            </div>
            <div className="demo-warning">
              <AlertTriangle size={15} />
              This is a local simulation. No order was sent to a broker.
            </div>
            <button
              className="primary-button full-width"
              type="button"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {step === "edit" ? (
              <>
                <div className="ticket-mode">
                  <LockKeyhole size={14} />
                  <span>
                    Demo account · {formatCurrency(cash, 0)} available cash
                  </span>
                  <span className="demo-pill">SIMULATED</span>
                </div>
                <div className="trade-segment">
                  <button
                    type="button"
                    className={side === "Buy" ? "selected buy-selected" : ""}
                    onClick={() => {
                      setSide("Buy");
                      setError("");
                    }}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    className={side === "Sell" ? "selected sell-selected" : ""}
                    onClick={() => {
                      setSide("Sell");
                      setError("");
                    }}
                  >
                    Sell
                  </button>
                </div>
                <div className="asset-ticket">
                  <span
                    className="asset-token"
                    style={
                      { "--asset-color": asset.color } as React.CSSProperties
                    }
                  >
                    {symbol.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{symbol}</strong>
                    <span>{asset.name}</span>
                  </div>
                  <div className="ticket-quote">
                    <span>Sample quote</span>
                    <strong>{formatCurrency(asset.price)}</strong>
                  </div>
                </div>
                <div className="ticket-fields">
                  <label>
                    Order type
                    <select
                      value={type}
                      onChange={event => {
                        const value = event.target.value as OrderType;
                        setType(value);
                        if (value === "Limit" && !limitText)
                          setLimitText(asset.price.toFixed(2));
                      }}
                    >
                      <option>Market</option>
                      <option>Limit</option>
                    </select>
                  </label>
                  {type === "Limit" && (
                    <label>
                      Limit price
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={limitText}
                        onChange={event => setLimitText(event.target.value)}
                      />
                    </label>
                  )}
                  <label>
                    Shares
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={sharesText}
                      onChange={event => setSharesText(event.target.value)}
                    />
                  </label>
                </div>
                <div className="order-estimate">
                  <span>Estimated {side === "Buy" ? "cost" : "proceeds"}</span>
                  <strong>{formatCurrency(estimated)}</strong>
                  <small>
                    {shares || 0} shares × {formatCurrency(price)}
                  </small>
                </div>
                {side === "Sell" && (
                  <div className="inline-hint">
                    Available to sell: {holding?.shares ?? 0} shares
                  </div>
                )}
                {error && (
                  <div className="form-error" role="alert">
                    {error}
                  </div>
                )}
                <div className="demo-warning">
                  <AlertTriangle size={15} />
                  Prices and fills are simulated sample data; this ticket cannot
                  place a real trade.
                </div>
                <button
                  className={`primary-button full-width ${side === "Sell" ? "sell-button" : ""}`}
                  type="button"
                  onClick={toReview}
                >
                  {side === "Buy" ? "Review buy order" : "Review sell order"}
                  <span>→</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="back-link"
                  type="button"
                  onClick={() => setStep("edit")}
                >
                  <ChevronLeft size={15} />
                  Edit order
                </button>
                <div className={`review-side ${side.toLowerCase()}`}>
                  {side === "Buy" ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}
                  <span>
                    {side} {shares} {symbol}
                  </span>
                  <span className="demo-pill">PAPER</span>
                </div>
                <div className="review-list">
                  <div>
                    <span>Order type</span>
                    <strong>{type}</strong>
                  </div>
                  {type === "Limit" && (
                    <div>
                      <span>Limit price</span>
                      <strong>{formatCurrency(limitPrice)}</strong>
                    </div>
                  )}
                  <div>
                    <span>Sample quote</span>
                    <strong>{formatCurrency(asset.price)}</strong>
                  </div>
                  <div>
                    <span>
                      Estimated {side === "Buy" ? "cost" : "proceeds"}
                    </span>
                    <strong>{formatCurrency(estimated)}</strong>
                  </div>
                  <div className="review-total">
                    <span>Estimated total</span>
                    <strong>{formatCurrency(estimated)}</strong>
                  </div>
                </div>
                <div className="demo-warning">
                  <AlertTriangle size={15} />
                  Confirming updates only this session's simulated portfolio.
                  Nothing is sent to a brokerage.
                </div>
                {error && (
                  <div className="form-error" role="alert">
                    {error}
                  </div>
                )}
                <button
                  className={`primary-button full-width ${side === "Sell" ? "sell-button" : ""}`}
                  type="button"
                  onClick={confirm}
                >
                  Confirm paper order
                </button>
              </>
            )}
          </>
        )}
        <div className="dialog-footnote">
          Demo workspace · Sample data · Not connected to a brokerage
        </div>
      </section>
    </div>
  );
}

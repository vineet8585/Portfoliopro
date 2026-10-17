import { useMemo, useState } from "react";
import {
  assetFor,
  initialOrders,
  initialPositions,
  marketUniverse,
  type OrderSide,
  type OrderType,
  type PaperOrder,
  type Position,
} from "./types";

export type SubmitPaperOrder = {
  side: OrderSide;
  type: OrderType;
  symbol: string;
  shares: number;
  limitPrice?: number;
};

export function usePaperPortfolio() {
  const [cash, setCash] = useState(42_584.23);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [orders, setOrders] = useState<PaperOrder[]>(initialOrders);

  const marketValue = useMemo(
    () =>
      positions.reduce(
        (sum, position) =>
          sum + position.shares * assetFor(position.symbol).price,
        0
      ),
    [positions]
  );
  const totalValue = cash + marketValue;
  const dayChange = positions.reduce(
    (sum, position) => sum + position.shares * assetFor(position.symbol).change,
    0
  );

  function submitOrder(input: SubmitPaperOrder): {
    ok: boolean;
    message: string;
    order?: PaperOrder;
  } {
    const { side, type, symbol, shares, limitPrice } = input;
    const asset = assetFor(symbol);
    if (!Number.isFinite(shares) || shares <= 0)
      return {
        ok: false,
        message: "Enter a share quantity greater than zero.",
      };
    if (type === "Limit" && (!limitPrice || limitPrice <= 0))
      return { ok: false, message: "Enter a valid limit price." };
    const current = positions.find(position => position.symbol === symbol);
    if (side === "Sell" && (!current || shares > current.shares))
      return {
        ok: false,
        message: "Your paper portfolio does not have enough shares to sell.",
      };

    const orderPrice = type === "Limit" ? (limitPrice as number) : asset.price;
    const isMarketable =
      type === "Market" ||
      (side === "Buy" ? orderPrice >= asset.price : orderPrice <= asset.price);
    const estimatedValue = orderPrice * shares;
    if (side === "Buy" && isMarketable && estimatedValue > cash)
      return {
        ok: false,
        message: "Not enough demo cash for this paper order.",
      };
    if (
      side === "Sell" &&
      isMarketable &&
      (!current || shares > current.shares)
    )
      return {
        ok: false,
        message: "Not enough shares available in this paper portfolio.",
      };

    const order: PaperOrder = {
      id: `PP-${Math.floor(Date.now() / 1000)
        .toString()
        .slice(-6)}`,
      symbol,
      side,
      type,
      shares,
      price: orderPrice,
      status: isMarketable ? "Filled" : "Open",
      submittedAt: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    if (isMarketable) {
      if (side === "Buy") {
        setCash(value => value - estimatedValue);
        setPositions(currentPositions => {
          const existing = currentPositions.find(
            position => position.symbol === symbol
          );
          if (!existing)
            return [
              ...currentPositions,
              { symbol, shares, averageCost: orderPrice },
            ];
          return currentPositions.map(position =>
            position.symbol === symbol
              ? {
                  ...position,
                  averageCost:
                    (position.shares * position.averageCost + estimatedValue) /
                    (position.shares + shares),
                  shares: position.shares + shares,
                }
              : position
          );
        });
      } else {
        setCash(value => value + estimatedValue);
        setPositions(currentPositions =>
          currentPositions
            .map(position =>
              position.symbol === symbol
                ? { ...position, shares: position.shares - shares }
                : position
            )
            .filter(position => position.shares > 0)
        );
      }
    }
    setOrders(currentOrders => [order, ...currentOrders]);
    return {
      ok: true,
      message: isMarketable
        ? "Paper order filled at the demo quote."
        : "Limit order added to the simulated open-order list.",
      order,
    };
  }

  function cancelOrder(id: string) {
    setOrders(currentOrders =>
      currentOrders.map(order =>
        order.id === id && order.status === "Open"
          ? { ...order, status: "Cancelled" }
          : order
      )
    );
  }

  return {
    cash,
    positions,
    orders,
    marketValue,
    totalValue,
    dayChange,
    submitOrder,
    cancelOrder,
    marketUniverse,
  };
}

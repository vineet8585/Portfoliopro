CREATE TABLE pp_market_asset (
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(160) NOT NULL,
    price DECIMAL(14,4) NOT NULL,
    day_change DECIMAL(14,4) NOT NULL,
    day_change_pct DECIMAL(9,4) NOT NULL,
    sector VARCHAR(64) NOT NULL,
    exchange_code VARCHAR(16) NOT NULL,
    color VARCHAR(7) NOT NULL,
    description VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL,
    PRIMARY KEY (symbol)
);

CREATE TABLE pp_fundamentals_snapshot (
    symbol VARCHAR(10) NOT NULL,
    market_cap_display VARCHAR(24) NOT NULL,
    pe_ratio DECIMAL(10,2) NULL,
    revenue_growth_pct DECIMAL(9,2) NULL,
    gross_margin_pct DECIMAL(9,2) NULL,
    operating_margin_pct DECIMAL(9,2) NULL,
    dividend_yield_pct DECIMAL(9,2) NULL,
    PRIMARY KEY (symbol),
    CONSTRAINT fk_pp_fundamentals_asset FOREIGN KEY (symbol) REFERENCES pp_market_asset (symbol)
);

INSERT INTO pp_market_asset (symbol, name, price, day_change, day_change_pct, sector, exchange_code, color, description, sort_order) VALUES
('NVDA', 'NVIDIA Corporation', 138.85, 3.92, 2.91, 'Semiconductors', 'NASDAQ', '#91B9FF', 'Designs accelerated computing platforms and graphics processing units.', 1),
('AAPL', 'Apple Inc.', 226.42, 1.88, 0.84, 'Technology', 'NASDAQ', '#DDE3EB', 'Designs and sells consumer electronics, software, and digital services.', 2),
('MSFT', 'Microsoft Corporation', 507.34, 2.31, 0.46, 'Software', 'NASDAQ', '#81C5FF', 'Provides software, cloud services, devices, and productivity tools.', 3),
('AMZN', 'Amazon.com, Inc.', 222.11, -1.42, -0.63, 'Consumer', 'NASDAQ', '#FDBD72', 'Operates e-commerce, cloud computing, and digital media businesses.', 4),
('META', 'Meta Platforms, Inc.', 741.65, 8.21, 1.12, 'Communication', 'NASDAQ', '#82C8FF', 'Builds social platforms and virtual and augmented reality products.', 5),
('GOOGL', 'Alphabet Inc.', 189.25, -0.23, -0.12, 'Communication', 'NASDAQ', '#F49D8F', 'Provides online search, advertising, cloud, and digital products.', 6),
('TSLA', 'Tesla, Inc.', 343.78, -8.27, -2.35, 'Automotive', 'NASDAQ', '#FF8989', 'Designs electric vehicles, energy storage, and clean energy products.', 7),
('AMD', 'Advanced Micro Devices, Inc.', 177.94, 3.28, 1.88, 'Semiconductors', 'NASDAQ', '#F4A17D', 'Develops high-performance computing and graphics technologies.', 8),
('JPM', 'JPMorgan Chase & Co.', 286.75, 1.16, 0.41, 'Financials', 'NYSE', '#A4D2B9', 'A global financial services firm serving consumers and businesses.', 9),
('V', 'Visa Inc.', 354.18, 2.03, 0.58, 'Financials', 'NYSE', '#9EB3FF', 'Operates a global electronic payments network.', 10),
('LLY', 'Eli Lilly and Company', 786.24, 5.74, 0.74, 'Healthcare', 'NYSE', '#D4A7FF', 'Discovers, develops, and markets medicines in several therapeutic areas.', 11),
('COST', 'Costco Wholesale Corporation', 985.30, -4.63, -0.47, 'Consumer', 'NASDAQ', '#86C9DB', 'Operates membership warehouses and e-commerce retail.', 12),
('SPY', 'SPDR S&P 500 ETF Trust', 614.42, 2.74, 0.45, 'ETF · Broad Market', 'NYSE ARCA', '#B5C5D0', 'An exchange-traded fund designed to track the S&P 500 Index.', 13);

INSERT INTO pp_fundamentals_snapshot (symbol, market_cap_display, pe_ratio, revenue_growth_pct, gross_margin_pct, operating_margin_pct, dividend_yield_pct) VALUES
('NVDA', '$3.4T', 51.20, 69.20, 74.50, 58.40, 0.03),
('AAPL', '$3.4T', 32.00, 3.40, 45.80, 31.80, 0.48),
('MSFT', '$3.9T', 38.40, 15.20, 69.60, 45.00, 0.72),
('AMZN', '$2.4T', 34.70, 9.60, 48.00, 10.80, 0.00),
('META', '$1.9T', 30.60, 22.10, 81.00, 41.00, 0.31),
('GOOGL', '$2.3T', 21.80, 13.40, 57.00, 31.00, 0.48),
('TSLA', '$1.1T', 78.20, 4.20, 19.80, 7.60, 0.00),
('AMD', '$295B', 45.20, 17.30, 52.00, 8.40, 0.00),
('JPM', '$820B', 12.90, 5.10, NULL, 37.00, 2.10),
('V', '$706B', 32.00, 10.20, 77.00, 68.00, 0.83),
('LLY', '$746B', 35.80, 16.30, 83.00, 40.00, 0.60),
('COST', '$436B', 58.00, 7.10, 12.80, 3.90, 0.54),
('SPY', 'ETF', NULL, NULL, NULL, NULL, 1.25);

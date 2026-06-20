const { useState, useEffect, useRef } = React;

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const GLOSSARY = [
  { term: "EA (Expert Advisor)", def: "A program that runs inside MetaTrader and trades automatically based on rules you code. It replaces the human clicking Buy/Sell." },
  { term: "MQL5", def: "The programming language used to write EAs for MetaTrader 5. It looks like C++. You write logic, MT5 executes trades." },
  { term: "Signal", def: "A condition that tells the EA to consider opening a trade. E.g. 'RSI crosses below 30' = potential buy signal." },
  { term: "RSI (Relative Strength Index)", def: "A momentum indicator (0–100). Below 30 = oversold (possible bounce up). Above 70 = overbought (possible drop). Period 14 is most common." },
  { term: "EMA (Exponential Moving Average)", def: "A moving average that weights recent prices more. When fast EMA crosses above slow EMA = bullish. Below = bearish." },
  { term: "ADX (Average Directional Index)", def: "Measures trend strength 0–100. Above 25 = trending market. Below 20 = ranging. EAs work better in trending conditions." },
  { term: "ATR (Average True Range)", def: "Measures average candle size (volatility). Used to set dynamic stop losses. ATR of 0.0010 on EURUSD M5 = about 10 pips average move." },
  { term: "Lot Size", def: "How much you're trading. 1 lot on EURUSD = 100,000 units. 0.01 lot (micro) = 1,000 units. Bigger lot = bigger profit AND bigger loss." },
  { term: "Stop Loss (SL)", def: "The price at which your trade closes automatically to cap your loss. Essential — never trade without one in a bot." },
  { term: "Take Profit (TP)", def: "The price at which your trade closes automatically to lock in profit." },
  { term: "Pip", def: "Smallest standard price move. On EURUSD, 1 pip = 0.0001. On USDJPY, 1 pip = 0.01. A 20-pip SL on EURUSD = 0.0020 from entry." },
  { term: "Spread", def: "The difference between Buy (Ask) and Sell (Bid) price. This is the broker's cut. On raw accounts it can be 0.1 pip + commission." },
  { term: "Slippage", def: "When your EA orders at price X but actually fills at price X+3 pips. Happens during fast markets or news. Eats into profit." },
  { term: "Drawdown (DD)", def: "How far your account has dropped from its peak. 10% drawdown on $1000 account = you're at $900. FTMO allows max 10% total DD." },
  { term: "Profit Factor (PF)", def: "Total wins divided by total losses. PF > 1 = profitable. PF > 1.5 = decent. PF > 2 = excellent. PF of 3+ in backtests = suspicious." },
  { term: "Win Rate", def: "% of trades that close in profit. 60% win rate ≠ profitable if your losses are 3x bigger than wins. Win rate alone means nothing." },
  { term: "Backtesting", def: "Running your EA on historical data to see how it would have performed. Fast way to test ideas — but can be misleading if done wrong." },
  { term: "Overfitting / Curve Fitting", def: "When you optimize an EA so perfectly on past data that it stops working on new data. Like memorizing the exam answers, not learning the subject." },
  { term: "Walk-Forward Test", def: "Split data into training (70%) and validation (30%). Optimize on training, test on validation. If performance drops >40%, the EA is curve-fitted." },
  { term: "Magic Number", def: "A unique ID you assign to each EA's trades. Lets multiple EAs run on the same account without interfering with each other." },
  { term: "Confluence", def: "When multiple indicators agree on the same direction. 2-of-3 confluence = safer signal than relying on 1 indicator alone." },
  { term: "Session", def: "Forex trading has 3 main sessions: Asian (quiet), London (active), New York (most volatile). Spreads are tightest during London/NY overlap." },
  { term: "Prop Firm", def: "A company that gives you a funded trading account after you pass a challenge. FTMO is a popular one. They keep 10–20% of profits." },
  { term: "FTMO Challenge", def: "Phase 1: make 10% profit in 30 days without breaching 5% daily or 10% total drawdown. Pass = funded account up to $200k." },
  { term: "Kill Switch", def: "A safety mechanism that stops all EA trading when drawdown hits a threshold. Prevents catastrophic losses from a malfunctioning EA." },
  { term: "News Freeze", def: "Pausing EA trading 15–30 mins before/after high-impact news (NFP, CPI, Fed). News causes huge spikes that can blow stops instantly." },
  { term: "VPS (Virtual Private Server)", def: "A cloud computer that runs your MT5 24/7 even when your laptop is off. Essential for live EA trading — FxSVPS is a trading-specific provider." },
  { term: "Tick", def: "Every price update in MT5. EAs can run OnTick() (every price change) or OnBar() (once per new candle). OnBar() is safer for signal logic." },
];

const LEVELS = [
  {
    id: 0, code: "L0", title: "Trading Fundamentals", subtitle: "Start here if you've never placed a trade",
    color: "#F0EDE4", icon: "📈",
    description: "Before you write a single line of bot logic, you need to understand what actually moves when a trade opens — price, spread, lot size, and risk. Skip this level if you've already traded manually. Don't skip it if you haven't.",
    whatYouLearn: ["How bid/ask/spread determine your real entry cost", "How to open a demo account and place a manual trade safely", "How to size a trade by risk BEFORE you ever automate it"],
    drills: [
      {
        id: "0A", type: "DRILL", title: "Bid, Ask, Spread, Pip — By Hand", time: "15 min", tag: "Market Basics", locked: false,
        concept: "Every price you see is actually TWO prices: Bid (what you sell at) and Ask (what you buy at). The gap between them is the spread — it's the broker's fee, paid the instant you open a trade. A pip is the smallest standard price step (0.0001 on EURUSD, 0.01 on USDJPY/XAUUSD-style pairs).",
        objective: "Given a live-style quote, calculate the spread in pips and the instant paper loss you take just by opening a trade.",
        task: "Quote: EURUSD Bid = 1.08452, Ask = 1.08465\n\n1. Calculate the spread in price terms (Ask − Bid)\n2. Convert that to pips (divide by 0.0001)\n3. If you open 0.10 lot BUY right now, what is your unrealized P&L the instant it fills? (spread cost only, before any price movement)\n4. Repeat for XAUUSDm: Bid = 2382.40, Ask = 2382.90 (pip = 0.01 here)\n\nFormula:\nSpread (pips) = (Ask − Bid) / pip_size\nInstant cost ($) ≈ Spread (pips) × pip value × lot size",
        deliverable: "Write out both spread calculations in pips. Then answer: why does a 13-pip spread matter much more to a scalper holding trades for 5 minutes than to a swing trader holding for 3 days?",
        hint: "EURUSD: (1.08465 − 1.08452) = 0.00013 → 1.3 pips. A scalper needs price to move past spread just to break even, fast. A swing trader's target is often 50-100x the spread, so it barely registers.",
        quiz: [
          { q: "Bid = 1.10200, Ask = 1.10215. Spread in pips?", a: "1.5 pips", options: ["0.15 pips", "1.5 pips", "15 pips", "150 pips"] },
          { q: "You always buy at the ___ and sell at the ___.", a: "Ask, Bid", options: ["Bid, Ask", "Ask, Bid", "Mid, Mid", "Spread, Spread"] }
        ]
      },
      {
        id: "0B", type: "MINI-PROJECT", title: "Demo Account: Your First Manual Trade", time: "30 min", tag: "Hands-On Setup", locked: false,
        concept: "Never connect real money to anything — not a manual trade, not an EA — before you've placed trades on a demo account. A demo uses fake money on real live prices, so you feel exactly how SL/TP, spread, and lot size behave, with zero risk.",
        objective: "Open a demo account with your broker (Exness or similar), place one manual trade with a stop loss and take profit, and watch it run.",
        task: "1. Open MT5, log into (or create) a Demo account — NOT a real account\n2. Pick a micro symbol (EURUSDm) and open the order panel\n3. Set lot size to 0.01 (the smallest)\n4. Set a Stop Loss 20 pips away and Take Profit 40 pips away from entry\n5. Place a BUY market order\n6. Watch the floating P&L for 5–10 minutes\n7. Close the trade manually OR let SL/TP close it",
        deliverable: "Write down: entry price, SL price, TP price, and the final result (closed manually / hit SL / hit TP). What was your floating P&L doing while you watched — did it match what you expected from the pip math in drill 0A?",
        hint: "If you don't have MT5 installed yet, download it from your broker's site, select 'Demo Account' at login (not 'existing account'), and it auto-fills with $10,000 fake balance. This costs nothing and is required before drill 2A onward makes sense.",
        quiz: [
          { q: "Why use a demo account before going live, even for manual trades?", a: "It shows real price behavior with zero financial risk", options: ["Demo accounts have better spreads", "It shows real price behavior with zero financial risk", "Demo accounts are required by law", "It's faster than live trading"] },
          { q: "On a $10,000 demo, why still use 0.01 lot instead of going bigger?", a: "Practicing real position sizing habits matters more than the fake balance", options: ["0.01 is the only size MT5 allows", "Practicing real position sizing habits matters more than the fake balance", "Bigger lots are blocked on demo", "It doesn't matter on demo"] }
        ]
      },
      {
        id: "0C", type: "CHALLENGE", title: "Size a Trade by Risk — Before Any Code", time: "25 min", tag: "Risk Basics", locked: false,
        concept: "Before you ever let a bot size a position, you should be able to do it by hand. The rule professionals use: never risk more than 1-2% of account balance on a single trade. Position size is DERIVED from your stop loss distance and risk amount — not picked first.",
        objective: "Without writing any code, manually work out correct lot sizes for 3 different accounts and risk scenarios.",
        task: "For each scenario, calculate: Risk Amount → Lot Size\n\nScenario 1: $200 demo account, 2% risk, 15-pip SL on EURUSDm (pip value ≈ $0.10 per 0.01 lot)\nScenario 2: $1,000 account, 1% risk, 25-pip SL on EURUSDm\nScenario 3: $50 account, 1% risk, 10-pip SL on EURUSDm (this is the kind of micro account many Uganda-based traders start with)\n\nFormula:\nRisk Amount = Balance × Risk%\nLot = Risk Amount / (SL_pips × pip_value_per_lot_unit)",
        deliverable: "Show your math for all 3 scenarios with final lot sizes (rounded down to the nearest 0.01). Then answer: in scenario 3, if the calculated lot rounds to 0.00, what does that tell you about trading a $50 account on EURUSDm with only 1% risk?",
        hint: "Scenario 3: $50 × 1% = $0.50 risk. At ~$0.01/pip per 0.01 lot, 10 pips = $0.10 risk per 0.01 lot. $0.50 / $0.10 = 0.05 lot → rounds fine here, but push the SL wider or the account smaller and you'll hit the broker's minimum lot floor — meaning the account is too small for that risk %, not that the math is wrong.",
        quiz: [
          { q: "Why calculate lot size FROM risk and SL distance, instead of just guessing a lot size?", a: "It keeps your dollar risk consistent no matter how far your stop loss is", options: ["It's faster to guess", "It keeps your dollar risk consistent no matter how far your stop loss is", "Brokers require it", "It guarantees profit"] },
          { q: "Your calculated lot size rounds down to 0.00. What should you do?", a: "Increase risk % slightly, use a tighter SL, or accept the account is too small for this trade", options: ["Round up to 0.01 anyway", "Increase risk % slightly, use a tighter SL, or accept the account is too small for this trade", "Switch to a different broker", "Ignore risk management for this trade"] }
        ]
      }
    ]
  },
  {
    id: 1, code: "L1", title: "Signal Mechanics", subtitle: "Build the brain — entry logic only",
    color: "#E8C547", icon: "🧠",
    description: "Every EA starts with one question: what triggers a trade? Here you build raw signal logic — no risk, no exits. Just entry conditions. This is where most beginners start AND where most EAs fail.",
    whatYouLearn: ["How indicators produce trading signals", "Why signals need filters to avoid false entries", "The difference between tick-based and bar-based logic"],
    drills: [
      {
        id: "1A", type: "DRILL", title: "RSI Crossover Trigger", time: "20 min", tag: "Signal Logic", locked: false,
        concept: "RSI (Relative Strength Index) measures momentum on a scale of 0–100. When it drops below 30, the market may be oversold (due for a bounce). When it rises above 70, it may be overbought (due for a drop). A 'crossover' means it ENTERS that zone — not just sits in it.",
        objective: "Write pseudocode that fires a BUY signal when RSI(14) crosses ABOVE 30, and a SELL signal when RSI crosses BELOW 70.",
        task: "Your logic must:\n1. Get RSI value on bar[1] (last closed bar) and bar[0] (current)\n2. Detect the crossover: previous bar < 30 AND current bar > 30 = BUY\n3. Print to log: 'BUY SIGNAL at [price]'\n4. Ensure it only fires ONCE per bar (not on every tick)\n\nPseudocode skeleton:\n──────────────────────\ndouble rsi_prev = iRSI(symbol, tf, 14, 1);\ndouble rsi_curr = iRSI(symbol, tf, 14, 0);\n\nif(rsi_prev < 30 && rsi_curr > 30) {\n   // BUY signal — write your code here\n}\n──────────────────────",
        deliverable: "Paste your completed pseudocode. Then answer: if your EA runs OnTick() and RSI is at 31 for 200 ticks in a row — how many times does your signal fire? How do you prevent that?",
        hint: "Track a bool 'signalFired' that resets at the start of each new bar. Check if a new bar opened using time comparison. This is the #1 bug in beginner EAs — signal spam.",
        quiz: [
          { q: "RSI is at 28 on bar[1] and 32 on bar[0]. Does a BUY signal fire?", a: "Yes", options: ["Yes", "No", "Only if ADX > 25", "Depends on timeframe"] },
          { q: "RSI is at 31 on bar[1] and 35 on bar[0]. Does a BUY signal fire?", a: "No", options: ["Yes", "No", "Only on M5", "Only if price is rising"] },
          { q: "Why check bar[1] instead of bar[0] for signal logic?", a: "Bar[1] is fully closed and confirmed", options: ["Bar[1] is faster", "Bar[1] is fully closed and confirmed", "Bar[0] doesn't exist yet", "Bar[0] has higher RSI"] }
        ]
      },
      {
        id: "1B", type: "MINI-PROJECT", title: "2-of-3 Confluence System", time: "45 min", tag: "Confluence", locked: false,
        concept: "Relying on ONE indicator is dangerous — it produces too many false signals. A confluence system requires MULTIPLE indicators to agree before entering. If 2 out of 3 indicators say BUY, the probability is higher than if only 1 does. This is the core of how professional EAs filter noise.",
        objective: "Build a signal scoring system where a trade fires only when 2 or more of 3 indicators agree on direction.",
        task: "Pick 3 indicators from this list:\n• RSI: score++ if RSI < 35 (buy bias) or RSI > 65 (sell bias)\n• EMA Cross: score++ if fast EMA > slow EMA (buy) or fast < slow (sell)\n• ADX: score++ if ADX > 25 (trend is strong enough to trade)\n• MACD: score++ if histogram > 0 (buy) or < 0 (sell)\n• Bollinger: score++ if price touched lower band (buy) or upper band (sell)\n\nLogic structure:\n──────────────────────\nint buyScore = 0;\nint sellScore = 0;\n\n// Check each indicator:\nif(rsi < 35) buyScore++;\nif(ema_fast > ema_slow) buyScore++;\nif(adx > 25) buyScore++; // applies to both\n\nif(buyScore >= 2) → Open BUY\nif(sellScore >= 2) → Open SELL\n──────────────────────",
        deliverable: "Write your complete scoring logic. Then answer:\n1. What happens when buyScore = 1? (do nothing — correct answer)\n2. What if buyScore = 2 AND sellScore = 2 simultaneously? (conflict — how do you resolve?)\n3. Which of your 3 indicators is the 'veto' — meaning if it disagrees, you skip the trade?",
        hint: "ADX is a great veto indicator — it doesn't pick direction, it confirms there IS a trend. If ADX < 20, even a 2-of-3 buy signal can fail in a ranging market. Make ADX a required condition, not a scored one.",
        quiz: [
          { q: "RSI says BUY, EMA says BUY, MACD says SELL. What does a 2-of-3 system do?", a: "Opens a BUY trade", options: ["Opens a BUY trade", "Opens a SELL trade", "Does nothing", "Waits for MACD to flip"] },
          { q: "What is the main advantage of confluence over a single indicator?", a: "Fewer false signals", options: ["Faster entries", "Fewer false signals", "Higher win rate always", "Smaller stop losses"] }
        ]
      },
      {
        id: "1C", type: "CHALLENGE", title: "Break Your Own Signal", time: "30 min", tag: "Critical Thinking", locked: false,
        concept: "Every signal system has conditions where it fails. Professional EA developers DELIBERATELY try to break their own logic before going live. If you can't find 3 ways your signal fails — you haven't thought hard enough.",
        objective: "Take your 1B scoring system and find 3 real market conditions where it produces false signals.",
        task: "For each false signal scenario:\n1. Name the market condition (e.g. 'price in a strong downtrend')\n2. Describe what your indicators show (e.g. 'RSI briefly crosses 30 on a dead cat bounce')\n3. Propose one FILTER RULE to catch it\n\nCommon failure scenarios to explore:\n• Ranging/choppy market after news spike\n• RSI oversold but price still in strong downtrend\n• EMA cross in a flat, low-volume Asian session\n• All 3 indicators fire right BEFORE a major news release\n• Signal fires but spread is 8x normal (news time)",
        deliverable: "3 scenarios in this format:\nSCENARIO: [market condition]\nWHAT HAPPENS: [what indicators show]\nFILTER RULE: [what you'd add to block it]\n\nThen pick your #1 most dangerous false signal and explain why it could blow an account.",
        hint: "The most deadly false signal is RSI oversold in a strong downtrend — it fires repeatedly as price keeps falling. The fix: add an HTF (higher timeframe) trend filter. Only take buys if H1 or H4 trend is also bullish.",
        quiz: [
          { q: "RSI crosses above 30 during a major downtrend on H4. Your M5 EA fires a BUY. This is a...", a: "False signal — trend is still bearish on higher timeframe", options: ["Valid signal — RSI confirms reversal", "False signal — trend is still bearish on higher timeframe", "Valid only if ADX < 20", "False only if spread is high"] }
        ]
      }
    ]
  },
  {
    id: 2, code: "L2", title: "Risk Architecture", subtitle: "Survival before profit",
    color: "#E8843D", icon: "🛡️",
    description: "A signal without risk control is a gambling machine. You can have a 90% win rate and still blow your account with one oversized trade. This level builds the protective layer every EA needs before it touches real money.",
    whatYouLearn: ["How to size positions based on % risk, not fixed lots", "ATR-based dynamic stop losses that adapt to volatility", "Kill switch design to prevent catastrophic drawdown"],
    drills: [
      {
        id: "2A", type: "DRILL", title: "Dynamic Lot Size Calculator", time: "25 min", tag: "Position Sizing", locked: false,
        concept: "Fixed lot sizes are a beginner trap. Trading 0.1 lot whether your account is $500 or $5,000 means your risk changes every day. Professionals risk a fixed % of their account per trade — typically 0.5% to 2%. This way, as your account grows, position sizes grow. As it shrinks, they shrink automatically.",
        objective: "Write a function that calculates the correct lot size given account balance, risk %, and stop loss in pips.",
        task: "The math:\n──────────────────────\nRisk Amount = AccountBalance × (riskPercent / 100)\nPip Value (EURUSD) ≈ $10 per pip per standard lot\nLot = Risk Amount / (SL_pips × PipValue)\n──────────────────────\n\nFunction template:\n──────────────────────\ndouble CalcLot(double riskPct, double slPips) {\n   double balance = AccountInfoDouble(ACCOUNT_BALANCE);\n   double riskAmt = balance * (riskPct / 100.0);\n   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);\n   double tickSz  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);\n   double pipVal  = tickVal / tickSz * _Point * 10;\n   double lot     = riskAmt / (slPips * pipVal);\n   double step    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);\n   return MathFloor(lot / step) * step;\n}\n──────────────────────\n\nTest cases to solve manually:\n• $1,000 account | 1% risk | 20-pip SL → lot = ?\n• $5,000 account | 0.5% risk | 30-pip SL → lot = ?\n• $500 account | 2% risk | 15-pip SL → lot = ?",
        deliverable: "Write the function (fill in or modify the template). Solve the 3 test cases. Then answer: why do we use MathFloor instead of MathRound when adjusting to LOT_STEP?",
        hint: "Answer to test 1: $1000 × 1% = $10 risk. $10 / (20 pips × ~$0.10/pip on 0.01 lot) = 0.05 lot. MathFloor prevents oversizing — always round DOWN on lot size, never up.",
        quiz: [
          { q: "Account: $2,000. Risk: 1%. SL: 20 pips. EURUSD pip value: $1/pip/0.1lot. What lot size?", a: "0.10 lot", options: ["0.01 lot", "0.05 lot", "0.10 lot", "0.20 lot"] },
          { q: "Why should you never risk a fixed lot (e.g. always 0.1) regardless of account size?", a: "Risk % changes as balance changes — 0.1 lot is huge on $500 but tiny on $50,000", options: ["Fixed lots are against broker rules", "Risk % changes as balance changes — 0.1 lot is huge on $500 but tiny on $50,000", "Lot size must match the timeframe", "Fixed lots cause slippage"] }
        ]
      },
      {
        id: "2B", type: "MINI-PROJECT", title: "ATR-Based Stop Loss System", time: "40 min", tag: "Dynamic Risk", locked: false,
        concept: "Fixed pip stops (always 20 pips) ignore market conditions. During quiet Asian session, 20 pips is huge. During volatile London open, 20 pips gets hit by noise instantly. ATR (Average True Range) measures the actual average candle size — so your SL adapts to current volatility automatically.",
        objective: "Build a function that sets SL and TP based on ATR(14) multipliers instead of fixed pips.",
        task: "The formula:\n──────────────────────\nSL = 1.5 × ATR(14)\nTP = 2.0 × ATR(14)\nRisk:Reward = 1:1.33 (TP is bigger than SL)\n──────────────────────\n\nFor a BUY trade:\n• Entry = Ask price\n• SL = Ask − (1.5 × ATR)\n• TP = Ask + (2.0 × ATR)\n\nFor a SELL trade:\n• Entry = Bid price\n• SL = Bid + (1.5 × ATR)\n• TP = Bid − (2.0 × ATR)\n\nWrite the function:\nvoid CalcATRStops(double &sl, double &tp, bool isBuy) {\n   double atr = iATR(_Symbol, PERIOD_M5, 14, 1);\n   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);\n   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);\n   if(isBuy) {\n      sl = NormalizeDouble(ask - 1.5*atr, _Digits);\n      tp = NormalizeDouble(ask + 2.0*atr, _Digits);\n   } else {\n      sl = NormalizeDouble(bid + 1.5*atr, _Digits);\n      tp = NormalizeDouble(bid - 2.0*atr, _Digits);\n   }\n}",
        deliverable: "Complete the function. Then: look at today's EURUSD M5 chart. Find the ATR value. Calculate actual SL/TP prices for a BUY at current price. Write them out. Are they reasonable or too wide/tight?",
        hint: "If ATR = 0.00080 (8 pips), then SL = 12 pips, TP = 16 pips. On a scalper, that's reasonable. If ATR = 0.00200 during news (20 pips), SL = 30 pips — your lot size function will automatically reduce the lot to keep risk constant.",
        quiz: [
          { q: "ATR(14) = 0.00100. You place a BUY at 1.08500. Where is your SL?", a: "1.08350 (1.5 × 0.00100 = 0.00150 below entry)", options: ["1.08400", "1.08350 (1.5 × 0.00100 = 0.00150 below entry)", "1.08480", "1.08200"] },
          { q: "Why is ATR-based SL better than a fixed 15-pip SL?", a: "It adapts to volatility — wider in volatile sessions, tighter in quiet ones", options: ["It's smaller so risk is lower", "It adapts to volatility — wider in volatile sessions, tighter in quiet ones", "Brokers prefer ATR stops", "ATR stops never get hit"] }
        ]
      },
      {
        id: "2C", type: "CHALLENGE", title: "Kill Switch Design", time: "35 min", tag: "Risk Architecture", locked: false,
        concept: "A kill switch stops all EA activity when losses hit a threshold. Without one, a malfunctioning EA can drain an account overnight while you sleep. Every professional EA stack has a kill switch — it's not optional. The question is: what triggers it, and what does it actually do?",
        objective: "Design (in writing, no code needed yet) a kill switch system for a multi-EA trading account.",
        task: "Answer all 5 design questions:\n\n1. TRIGGER METRIC\nWhich is better for daily kill?\n   a) Equity drops X% from today's starting equity\n   b) X consecutive losing trades\n   c) Net P&L drops below -$Y\n   Pick one and justify.\n\n2. WHAT 'KILL' MEANS\n   a) Close all open trades immediately\n   b) Block new trades but let existing ones close normally\n   c) Send alert only — human decides\n   Which do you choose and why?\n\n3. RESET LOGIC\n   a) Auto-reset at midnight server time\n   b) Manual reset only (you send a Telegram command)\n   c) Auto-reset after 4 hours\n   Risk of each option?\n\n4. EA ISOLATION\nIf EA_A hits the kill threshold — should EA_B also stop?\nWhen yes, when no?\n\n5. FALSE POSITIVE PREVENTION\nHow do you make sure a single bad-luck trade doesn't\ntrigger the kill during a legitimate market move?",
        deliverable: "A kill switch spec in bullet points answering all 5 questions. Include your daily DD% threshold choice (most prop firms use 4.5% warning → 5% hard stop — why not 2%? why not 8%?)",
        hint: "Option (b) for KILL action is usually best — closing everything at market during news causes slippage. Let open trades hit their SL/TP naturally. Block new entries only. For threshold: if your EA's normal daily max loss is 1.5%, set kill at 3–4%. If it fires daily, your threshold is wrong.",
        quiz: [
          { q: "Your daily kill switch is set at 3% DD. Account starts at $10,000. Kill fires when equity hits:", a: "$9,700", options: ["$9,700", "$7,000", "$9,970", "$9,300"] },
          { q: "Your kill switch fires. Should you immediately restart it after 30 minutes?", a: "No — investigate why it fired before restarting", options: ["Yes — market might have reversed", "No — investigate why it fired before restarting", "Yes — EAs need continuous runtime", "Only restart if it's Asian session"] }
        ]
      }
    ]
  },
  {
    id: 3, code: "L3", title: "Backtesting Tradecraft", subtitle: "Stress-test before you bet real money",
    color: "#4CAF6D", icon: "📊",
    description: "Most traders backtest wrong. They optimize until the chart looks perfect, then lose money live. This level teaches you to backtest honestly — finding real edge, not flattering numbers.",
    whatYouLearn: ["Why 200 trades is the minimum sample size", "Walk-forward validation to detect curve fitting", "How to deliberately break your own backtest"],
    drills: [
      {
        id: "3A", type: "DRILL", title: "The 200-Trade Minimum Rule", time: "30 min", tag: "Statistical Validity", locked: false,
        concept: "Statistics only work with enough data. A 60% win rate on 20 trades means almost nothing — it could easily be luck. On 200 trades, you have real signal. This is why a 3-month backtest with only 50 trades is dangerous — you're trading on noise, not edge.",
        objective: "Run a backtest on any EA and calculate whether your sample size is statistically meaningful.",
        task: "In MT5 Strategy Tester:\n1. Load any EA (even a simple RSI crossover)\n2. Run on EURUSD M5, last 3 months\n3. Record: total trades, win rate %, profit factor, max DD%\n\nThen calculate the confidence interval:\n──────────────────────\nFormula: ±1.96 × √(p × (1−p) / n)\nwhere p = win rate as decimal, n = number of trades\n\nExample:\nwin rate = 0.58, n = 50:\n±1.96 × √(0.58 × 0.42 / 50) = ±0.137\nReal win rate could be 44% to 72% — useless!\n\nwin rate = 0.58, n = 200:\n±1.96 × √(0.58 × 0.42 / 200) = ±0.068\nReal win rate: 51% to 65% — still uncertain but usable.\n──────────────────────\n\nCalculate YOUR result with your actual n and win rate.",
        deliverable: "Your backtest results + confidence interval calculation. Then answer: how many MORE months do you need to run to get n ≥ 200? Is your current win rate still above 50% at the lower confidence bound?",
        hint: "If n = 80 and win rate = 55%, lower bound = 55% − 10.9% = 44.1% — below breakeven. You don't have an edge, you might just have luck. Run longer before going live.",
        quiz: [
          { q: "Why is 200 trades considered the minimum for valid backtesting?", a: "Below 200, the confidence interval is too wide — results could be random luck", options: ["MT5 requires 200 trades", "Below 200, the confidence interval is too wide — results could be random luck", "200 trades covers all market conditions", "Prop firms require exactly 200"] },
          { q: "You have 50 trades with 65% win rate. The confidence interval is ±13%. What does that mean?", a: "Real win rate could be 52%–78% — the data is unreliable", options: ["Your EA is excellent — 65% is confirmed", "Real win rate could be 52%–78% — the data is unreliable", "You need to add more indicators", "65% minus 13% = 52%, which is still above 50% so it's fine"] }
        ]
      },
      {
        id: "3B", type: "MINI-PROJECT", title: "Walk-Forward Validation", time: "60 min", tag: "Validation", locked: false,
        concept: "If you optimize an EA on ALL your historical data and then 'test' it on the same data — that's not a test, that's cheating. Walk-forward testing splits your data: you optimize on the first 70%, then test on the remaining 30% that the EA has never seen. A good EA stays profitable. A curve-fitted EA collapses.",
        objective: "Run two backtests on different date periods and compare results to detect overfitting.",
        task: "For any EA:\n\nPhase 1 — In-Sample (Jan 1 – Apr 30):\n• Run optimization on exactly 2 parameters\n  (e.g. RSI period: 10–20, ATR multiplier: 1.0–2.0)\n• Pick the highest Profit Factor result\n• Record: PF_in, WinRate_in, DD_in\n\nPhase 2 — Out-of-Sample (May 1 – Jun 20):\n• Run that EXACT parameter set on new data\n• Do NOT re-optimize\n• Record: PF_out, WinRate_out, DD_out\n\nCalculate the degradation ratio:\n──────────────────────\nRatio = PF_out / PF_in\n> 0.7 = good (holds up)\n0.5–0.7 = acceptable (mild degradation)\n< 0.5 = curve-fitted (this EA is not real)\n──────────────────────",
        deliverable: "Two result tables. Calculate your ratio. If < 0.6: which parameters did you optimize? Could you reduce the number to make the EA more robust? What's the minimum number of parameters an EA needs?",
        hint: "The fewer parameters you optimize, the more robust the EA. A simple EMA crossover with 2 parameters is often more robust than a complex 6-parameter system that was 'perfectly' tuned.",
        quiz: [
          { q: "In-sample PF = 2.4. Out-of-sample PF = 0.9. Ratio = 0.375. This EA is:", a: "Curve-fitted — not ready for live trading", options: ["Excellent — 0.9 is still profitable", "Curve-fitted — not ready for live trading", "Normal degradation — acceptable", "Needs more in-sample data"] },
          { q: "You optimize 8 parameters on 3 years of data and get PF = 4.2. You should feel:", a: "Suspicious — too many optimized parameters with perfect results", options: ["Excited — this is a great EA", "Suspicious — too many optimized parameters with perfect results", "Confident — 3 years is enough data", "Ready to go live immediately"] }
        ]
      },
      {
        id: "3C", type: "CHALLENGE", title: "Deliberately Curve-Fit an EA", time: "45 min", tag: "Anti-Overfitting", locked: false,
        concept: "The best way to understand curve fitting is to deliberately create it. Over-optimize until you have a 'perfect' equity curve — then prove it falls apart on new data. This exercise creates a gut feeling for the difference between real edge and overfitted garbage.",
        objective: "Manufacture a fraudulently good backtest, then expose it.",
        task: "Step 1 — CREATE THE FRAUD:\n• Open MT5 Strategy Tester\n• Enable genetic optimization\n• Optimize 5+ parameters simultaneously\n• Target: PF > 3.0, DD < 5%, smooth equity curve\n• Write down those parameter values\n\nStep 2 — EXPOSE THE FRAUD:\n• Take those exact parameters\n• Run on a DIFFERENT 3-month period\n• OR run on GBPUSD instead of EURUSD\n• Document how badly it collapses\n\nStep 3 — DIAGNOSE IT:\nLook for curve-fit tells:\n□ Max consecutive losses = 1 or 2\n□ Equity curve suspiciously smooth\n□ Different symbols give wildly different results\n□ Changing one parameter by 1 unit wrecks performance",
        deliverable: "Before/after screenshots or manual results. Then write 1 paragraph: describe the EMOTIONAL experience of watching a 'perfect' EA collapse. What would you have done if you'd gone live with it? This is the most important thing you'll write in this course.",
        hint: "The collapse is the lesson. If you feel it, you'll never blindly trust an optimization result again. Professional traders call a too-good backtest a 'red flag', not a 'success'.",
        quiz: [
          { q: "Your EA has PF = 4.1 in backtest but max consecutive losses = 1. This is most likely:", a: "Curve-fitted — real markets don't produce such clean results", options: ["An excellent EA ready to go live", "Curve-fitted — real markets don't produce such clean results", "A sign of a perfect strategy", "Normal if you used genetic optimization"] }
        ]
      }
    ]
  },
  {
    id: 4, code: "L4", title: "Live Execution Ops", subtitle: "From backtest to live — the gap nobody talks about",
    color: "#4D8FE8", icon: "⚡",
    description: "Backtests assume perfect fills, zero slippage, and instant execution. Live trading doesn't care about your assumptions. This level bridges the gap between paper profits and real money.",
    whatYouLearn: ["How slippage and spread silently drain your EA's edge", "Building Telegram trade journals for real-time monitoring", "The 5-day ghost trade test — auditing your EA like a professional"],
    drills: [
      {
        id: "4A", type: "DRILL", title: "Slippage & Spread Audit", time: "20 min", tag: "Execution Reality", locked: false,
        concept: "Slippage is the difference between where your EA ordered and where it actually filled. On a fast EURUSD pair during London open, slippage of 3–5 pips per trade is common. If your EA expects 15-pip profits but bleeds 4 pips in slippage every entry and exit — it's not profitable. This is why backtests over-perform real trading.",
        objective: "Audit your last 20 trades for slippage and identify which session costs you the most.",
        task: "In MT5 → Account History (tab):\n1. Export last 20 trades to CSV or record manually\n2. For each trade record:\n   • Symbol\n   • Direction (Buy/Sell)\n   • Requested price (comment field or signal price)\n   • Actual fill price\n   • Session: Asian / London / NY / Overlap\n   • Spread at entry time\n\n3. Calculate:\n   • Slippage per trade (in pips)\n   • Average slippage by session\n   • Worst single slippage event\n\n4. Real cost calculation:\n   If avg slippage = 2 pips on 0.05 lot:\n   Cost = 2 × $0.50/pip = $1 per trade\n   On 100 trades/month = $100 hidden cost",
        deliverable: "Your audit table. Answer: does your EA's backtested profit factor still hold after accounting for real spread + slippage + commission? Calculate the adjusted profit.",
        hint: "Exness raw spread account: spread ≈ 0.1 pip BUT commission ≈ $3.50/lot each way = $7 round trip on 1.0 lot. On 0.05 lot = $0.35 per trade. If your average win is only $1.50 — commission alone kills the edge.",
        quiz: [
          { q: "Your EA profits $0.80 average per trade. Broker commission is $0.40 each way ($0.80 round trip). Is this EA profitable live?", a: "No — commission equals the entire profit, leaving nothing", options: ["Yes — $0.80 profit is positive", "No — commission equals the entire profit, leaving nothing", "Yes — commission only applies to losses", "Depends on win rate"] }
        ]
      },
      {
        id: "4B", type: "MINI-PROJECT", title: "Telegram Trade Journal", time: "45 min", tag: "Live Monitoring", locked: false,
        concept: "Watching an EA trade without logs is like flying blind. A Telegram journal sends you a structured message every time a trade opens or closes — so you can review every entry from your phone in real time. This is how professional algo traders monitor live EAs remotely.",
        objective: "Add structured Telegram trade alerts to an EA so every trade sends a formatted message.",
        task: "Message format on OPEN:\n──────────────────────\n🤖 [EA Name] | EURUSD\n📍 BUY opened\n💰 Lot: 0.02 | Entry: 1.08450\n🎯 TP: 1.08650 | 🛡 SL: 1.08250\n📊 Signal: 3/3 confluence\n⏱ 2024.06.20 14:05\n──────────────────────\n\nMessage format on CLOSE:\n──────────────────────\n✅ CLOSED: +18.5 pips | +$3.70\n📈 Today: 3W 2L | Net: +$8.20\n──────────────────────\n\nMQL5 code pattern:\n──────────────────────\nstring msg = StringFormat(\n  \"🤖 EuroScalper | %s\\n\"\n  \"📍 %s opened\\n\"\n  \"💰 Lot: %.2f | Entry: %.5f\\n\"\n  \"🎯 TP: %.5f | 🛡 SL: %.5f\",\n  _Symbol, direction, lot, entry, tp, sl\n);\n\n// Send via WebRequest:\nstring url = \"https://api.telegram.org/bot\" + BOT_TOKEN +\n             \"/sendMessage?chat_id=\" + CHAT_ID +\n             \"&text=\" + msg;\nuchar result[]; string headers;\nWebRequest(\"GET\", url, \"\", 0, result, headers);\n──────────────────────",
        deliverable: "Write the complete send function for both OPEN and CLOSE messages. Test it — send a manual test message from MT5 Script. Does it arrive? Check your WebRequest URL whitelist on FxSVPS.",
        hint: "Common bugs: (1) Space in message breaks URL — use %20 or switch to POST method. (2) WebRequest returns -1 if the URL isn't whitelisted in MT5 Tools → Options → Expert Advisors. (3) Bot token or chat_id wrong — test with browser first.",
        quiz: [
          { q: "WebRequest() returns -1. Most likely cause?", a: "The URL is not whitelisted in MT5 Expert Advisors settings", options: ["Telegram is down", "The URL is not whitelisted in MT5 Expert Advisors settings", "Wrong lot size format", "EA magic number conflict"] }
        ]
      },
      {
        id: "4C", type: "CHALLENGE", title: "The 5-Day Ghost Trade Audit", time: "Ongoing", tag: "Quality Assurance", locked: false,
        concept: "A ghost trade test means you run your EA on demo for 5 full trading days WITHOUT intervening — then audit every single trade like a quality inspector. You're looking for rule violations (trades that shouldn't have opened), execution bugs, and unexpected behavior. This is how professionals QA an EA before going live.",
        objective: "Run your EA unattended for 5 days, then audit every trade against your own rules.",
        task: "SETUP (Day 0):\n• Load EA on EURUSD M5 demo chart\n• Enable all filters (news freeze, session filter, etc.)\n• Start Telegram journal (from 4B)\n• DO NOT touch it for 5 days\n\nAUDIT (Day 5):\nFor every trade in Telegram log, answer:\n\n□ Was there a valid signal? (check your rules)\n□ Were all confluence conditions met?\n□ Did it open during a banned session or news window?\n□ Is the magic number correct?\n□ Did SL/TP calculate correctly from ATR?\n□ Did it fire more than once per bar?\n□ Any zombie trades (open with no SL)?\n\nLabel each trade:\n✅ VALID — matches all rules\n⚠️ RULE VIOLATION — opened outside rules\n🐛 BUG — code error detected\n❓ UNKNOWN — need to investigate",
        deliverable: "Trade audit table. Count: how many VALID vs RULE VIOLATION vs BUG. A professional standard is 100% VALID. Any violation = a code fix before going live. List what you'd fix.",
        hint: "The most common ghost trade failures: (1) signal fires on bar open AND bar close (double fire bug), (2) trade opens at 23:59 (before server midnight reset), (3) SL set to 0 (broker rejects, trade runs without SL), (4) news freeze not reading calendar correctly.",
        quiz: [
          { q: "Your audit shows 3 trades opened during news windows (supposed to be frozen). This means:", a: "There is a bug in your news freeze logic — fix it before going live", options: ["The news wasn't high-impact enough", "There is a bug in your news freeze logic — fix it before going live", "News freeze is optional", "Demo accounts don't apply news freeze"] }
        ]
      }
    ]
  },
  {
    id: 5, code: "L5", title: "FTMO Simulation", subtitle: "Trade like the funded challenge is live",
    color: "#E8B339", icon: "🏆",
    description: "Your goal is a funded account. FTMO gives you capital to trade — but sets strict rules you must not break. This level simulates the real challenge with real rules. If you'd fail here, you'll fail there.",
    whatYouLearn: ["FTMO rules mapped to EA parameters you must enforce", "Running a 30-day funded account simulation", "Post-mortem analysis that prepares you for the real challenge"],
    drills: [
      {
        id: "5A", type: "DRILL", title: "FTMO Rules Mapping", time: "30 min", tag: "FTMO Prep", locked: false,
        concept: "FTMO gives you a $100,000 account to trade — but break ANY of their rules once and the challenge is failed. Most EA traders fail not because of bad signals, but because they didn't enforce the rules in code. You need to map every FTMO rule to a specific mechanism in your EA or monitor.",
        objective: "Map every FTMO Phase 1 rule to a specific EA parameter, monitor, or manual check you own.",
        task: "FTMO Phase 1 Rules (Standard $100k):\n\n1. Profit Target: +10% ($10,000) in 30 days\n2. Max Daily Loss: 5% of initial balance ($5,000)\n3. Max Total Loss: 10% of initial balance ($10,000)\n4. Minimum Trading Days: 4 separate days with at least 1 trade\n\nFor each rule, complete this table:\n\nRULE 1 — Profit Target\n• Which EA enforces this? Or is it manual?\n• What happens when you reach 8%? Do you continue or stop?\n• Risk of going too aggressive near the target?\n\nRULE 2 — Max Daily Loss 5%\n• Which monitor blocks new trades at 4.5% daily DD?\n• What if multiple EAs all lose simultaneously?\n• Does your kill switch track daily DD from midnight server time?\n\nRULE 3 — Max Total Loss 10%\n• Is this tracked separately from daily?\n• If you hit 8% total DD, do you manually reduce risk?\n• Which EA could cause sudden 5% DD from a grid?\n\nRULE 4 — Minimum Trading Days\n• Does your EA trade every day or only on signal?\n• What if all 4 days fall in the same week?",
        deliverable: "A 4-row mapping table. Highlight your highest risk rule — the one most likely to cause a failure given your current EA stack. Then write one sentence on how you'd fix that risk.",
        hint: "Rule 2 (daily loss) is the most common failure point for scalper EAs. A bad news spike can hit 3–4% daily in 20 minutes. The fix: news freeze + daily DD monitor that blocks ALL EAs simultaneously when approaching 4%.",
        quiz: [
          { q: "FTMO $100k account. Max daily loss = 5%. Today's starting equity = $102,000. Kill switch should fire when equity hits:", a: "$97,000 (5% of initial $100k, not today's equity)", options: ["$96,900 (5% of $102,000)", "$97,000 (5% of initial $100k, not today's equity)", "$99,000", "$95,000"] },
          { q: "You've made 9.5% profit. You need 0.5% more. Should you increase lot size to finish faster?", a: "No — increased lot raises DD risk. One bad trade could breach max loss and fail the challenge", options: ["Yes — you're so close, risk it", "No — increased lot raises DD risk. One bad trade could breach max loss and fail the challenge", "Yes — FTMO rewards speed", "Only increase if win rate was above 60%"] }
        ]
      },
      {
        id: "5B", type: "MINI-PROJECT", title: "30-Day Challenge Simulation", time: "30 days", tag: "Simulation", locked: false,
        concept: "There is no substitute for running the actual simulation. Paper trading with fake attention is useless. You need to run your real EA stack on a $100k demo account under full FTMO rules — and treat every single day like real money. The psychological pressure is part of the lesson.",
        objective: "Run a full FTMO Phase 1 simulation with your actual EA stack for 30 consecutive trading days.",
        task: "SETUP:\n• Open $100,000 MT5 demo account\n• Load all active EAs (EuroScalper, GoldSniper, ScalpEdge)\n• Set hard rules:\n  - Stop if daily equity < $95,000 (5% daily DD)\n  - Stop if total equity < $90,000 (10% total DD)\n  - Target: $110,000 (10% profit)\n\nDAILY CHECK-IN (takes 5 min):\n□ Record today's starting equity\n□ Record ending equity\n□ Note biggest win and biggest loss\n□ Note any rule-threatening events\n□ Note EA behavior during news\n\nWEEKLY REVIEW:\n□ Is daily DD % trending upward? (warning sign)\n□ Which EA is performing best/worst?\n□ Any code bugs found?\n□ Confidence level: 1–10 you'll pass\n\nDAY 30:\n□ Did you hit 10% target? ✅\n□ Did you breach daily DD? ❌\n□ Did you breach total DD? ❌\n□ Minimum 4 trading days met? ✅",
        deliverable: "Day 30 report answering: Pass or Fail? If fail — exactly which rule, on which day, from which EA? What single change would have prevented it? Honesty is required — this is your real preparation.",
        hint: "Most EA traders fail the simulation on Day 3–7 (before they develop discipline) or during a surprise news event. Keep a daily DD warning at 3.5% — not the full 5%. This gives you margin.",
        quiz: [
          { q: "Day 15 of your simulation. Equity is $106,500. Max total DD limit is $90,000. How much can you lose from current equity before total limit breach?", a: "$16,500 (current $106,500 − $90,000 floor)", options: ["$6,500 (10% of current equity)", "$16,500 (current $106,500 − $90,000 floor)", "$10,000 flat", "$1,650"] }
        ]
      },
      {
        id: "5C", type: "CHALLENGE", title: "Simulation Post-Mortem", time: "60 min", tag: "Reflection", locked: false,
        concept: "A post-mortem is a professional after-action report. Prop firms and hedge funds do them after every significant trading period. It forces you to be honest about what worked, what failed, and what you'd change — before real money is involved.",
        objective: "Write a full post-mortem on your 30-day simulation. Honest, detailed, structured.",
        task: "Your post-mortem must cover ALL of these:\n\n1. PERFORMANCE SUMMARY\n   • Final return %\n   • Max drawdown % (daily and total peaks)\n   • Estimated Sharpe: avg daily return / std dev of daily returns\n   • Best day, worst day\n\n2. EA BREAKDOWN\n   • Which EA generated most profit?\n   • Which caused most drawdown?\n   • Any EA that underperformed its backtest significantly?\n\n3. WORST DAY ANALYSIS\n   • Date, what happened in market\n   • Which EA opened the worst trades\n   • Did your kill switch fire? Should it have?\n\n4. SIGNAL QUALITY REVIEW\n   • Were there obvious false signals in hindsight?\n   • Did confluence filters help or miss bad trades?\n\n5. CORRELATION RISK\n   • Did multiple EAs lose on the same day simultaneously?\n   • If EURUSD dropped sharply, did both EuroScalper AND GoldSniper lose?\n   • This is hidden risk — correlated EAs are not diversified\n\n6. CHANGES BEFORE REAL FTMO\n   • List exactly what you'd change (code, parameters, risk %)\n   • Rank them by importance\n\n7. READINESS RATING\n   • 1–10: how confident are you to pass Phase 1 with real money?\n   • What specific score would make you feel ready?",
        deliverable: "Written post-mortem covering all 7 sections. Length doesn't matter — honesty does. Share one finding that genuinely surprised you.",
        hint: "A correlation surprise is common: GoldSniper and EuroScalper both take buy trades when USD weakens. So on a strong USD day, BOTH lose simultaneously — doubling your DD. The fix is adding an inverse-correlated EA or capping total exposure when both are in the market.",
        quiz: [
          { q: "Your simulation: EuroScalper lost 3 days in a row. GoldSniper also lost those same 3 days. This suggests:", a: "The EAs are correlated — they share a common risk factor (e.g. USD strength)", options: ["Both EAs have bad code", "The EAs are correlated — they share a common risk factor (e.g. USD strength)", "Coincidence — 3 days isn't significant", "The session filter is broken on both"] }
        ]
      }
    ]
  }
];

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const TYPE_META = {
  "DRILL":        { border: "#3DD6C4", label: "⚡ DRILL",     desc: "Focused 20–30 min skill exercise" },
  "MINI-PROJECT": { border: "#A78BFA", label: "🔨 PROJECT",   desc: "Build something real in 45–60 min" },
  "CHALLENGE":    { border: "#E5484D", label: "🔥 CHALLENGE", desc: "Apply and stress-test your knowledge" },
};

const BELT_NAMES = ["White Belt", "Yellow Belt", "Orange Belt", "Green Belt", "Blue Belt", "Black Belt"];

// Small uppercase, tracked-out section label
const Eyebrow = ({ children, color }) => (
  <div style={{ color: color || "#6b6a76", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace" }}>
    {children}
  </div>
);

// Segmented belt-rank progress bar — one stitched panel per drill in the level
const BeltBar = ({ color, done, total, height }) => (
  <div style={{ position: "relative", background: "#1a1a24", borderRadius: "4px", height: height || "9px", overflow: "hidden", border: "1px solid #22222e" }}>
    <div style={{ position: "absolute", inset: 0, width: `${total ? (done / total) * 100 : 0}%`, background: color, transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, borderRight: i < total - 1 ? "1px solid rgba(10,10,15,0.45)" : "none" }} />
      ))}
    </div>
  </div>
);

// Hanko seal — the stamp a sensei presses onto finished work.
// 済 (sumi) is the character used on real Japanese paperwork to mark something "settled / done."
const Seal = ({ size }) => {
  const s = size || 46;
  return (
    <div className="dojo-seal" style={{
      width: s, height: s, borderRadius: "50%", border: `${Math.max(2, s * 0.05)}px solid var(--vermillion)`,
      display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0,
    }}>
      <div style={{ position: "absolute", inset: s * 0.12, border: "1px solid var(--vermillion)", borderRadius: "50%", opacity: 0.55 }} />
      <span style={{ fontFamily: "'Shippori Mincho',serif", color: "var(--vermillion)", fontSize: s * 0.42, fontWeight: 700, lineHeight: 1 }}>済</span>
    </div>
  );
};

function EATradingDojo() {
  const [screen, setScreen]         = useState("home");   // home | levels | drill | glossary | quiz
  const [activeLevel, setActiveLevel] = useState(1);
  const [activeDrill, setActiveDrill] = useState(null);
  const [completed, setCompleted]   = useState({});
  const [notes, setNotes]           = useState({});
  const [quizState, setQuizState]   = useState({});       // { drillId: { qIdx: answer } }
  const [glossFilter, setGlossFilter] = useState("");
  const [showConcept, setShowConcept] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiReply, setAiReply]       = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState(() => { try { return localStorage.getItem("dojo-api-key") || ""; } catch { return ""; } });
  const noteRef = useRef({});
  const [loaded, setLoaded] = useState(false);

  // ── persistence (browser localStorage — survives reloads on this device) ──
  const persist = (c, n, q) => {
    try {
      localStorage.setItem("dojo-progress", JSON.stringify({ completed: c, notes: n, quizState: q }));
    } catch (e) {
      console.error("Storage save failed:", e);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dojo-progress");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.completed) setCompleted(parsed.completed);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.quizState) setQuizState(parsed.quizState);
      }
    } catch (e) {
      // no saved progress yet — fine on first run
    }
    setLoaded(true);
  }, []);

  const markComplete = (id) => {
    const c = { ...completed, [id]: !completed[id] };
    setCompleted(c);
    persist(c, notes, quizState);
  };

  const saveNote = (id, val) => {
    const n = { ...notes, [id]: val };
    setNotes(n);
    persist(completed, n, quizState);
  };

  const answerQuiz = (drillId, qIdx, answer) => {
    const prev = quizState[drillId] || {};
    const q = { ...prev, [qIdx]: answer };
    const qs = { ...quizState, [drillId]: q };
    setQuizState(qs);
    persist(completed, notes, qs);
  };

  // ── AI Tutor ──
  const askAI = async () => {
    if (!aiQuestion.trim() || aiLoading) return;
    const apiKey = localStorage.getItem("dojo-api-key");
    if (!apiKey) {
      setAiReply("AI Tutor needs your own Anthropic API key to work outside Claude.ai. Go to console.anthropic.com, create a key, then enter it below.");
      return;
    }
    setAiLoading(true);
    setAiReply("");
    const context = activeDrill
      ? `The student is working on drill: "${activeDrill.title}". Objective: ${activeDrill.objective}.`
      : "The student is learning algorithmic trading / EA bot development.";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a trading bot (EA) tutor for a beginner-to-intermediate student learning MQL5 / MetaTrader 5 algorithmic trading. Be concise, practical, and use simple language. Avoid jargon unless you explain it. ${context}\n\nStudent question: ${aiQuestion}`
          }]
        })
      });
      const data = await res.json();
      if (data.error) { setAiReply(`API error: ${data.error.message || "check your API key"}`); setAiLoading(false); return; }
      const text = data.content?.map(b => b.text || "").join("") || "No response received.";
      setAiReply(text);
    } catch {
      setAiReply("Connection error. Check your internet and try again.");
    }
    setAiLoading(false);
  };

  // ── Computed ──
  const allDrills = LEVELS.flatMap(l => l.drills);
  const totalDone = allDrills.filter(d => completed[d.id]).length;
  const totalPct  = Math.round((totalDone / allDrills.length) * 100);

  const levelProg = (lv) => {
    const done = lv.drills.filter(d => completed[d.id]).length;
    return { done, total: lv.drills.length, pct: Math.round((done / lv.drills.length) * 100) };
  };

  const level = LEVELS.find(l => l.id === activeLevel);
  const screenKey = screen === "drill" && activeDrill ? `drill-${activeDrill.id}` : screen;

  // ── Quiz status for a drill ──
  const quizStatus = (drill) => {
    if (!drill.quiz) return null;
    const answers = quizState[drill.id] || {};
    const total = drill.quiz.length;
    const correct = drill.quiz.filter((q, i) => answers[i] === q.a).length;
    return { correct, total, done: Object.keys(answers).length === total };
  };

  // ─────────────────────────────────────────────
  // SCREENS
  // ─────────────────────────────────────────────

  const S = { // shared styles
    page: { background: "var(--void)", minHeight: "100vh", color: "var(--paper)", fontFamily: "'JetBrains Mono','SF Mono',monospace", padding: "22px 18px 44px", boxSizing: "border-box" },
    h1:   { fontFamily: "'Shippori Mincho',serif", fontSize: "21px", color: "var(--paper)", margin: "0 0 4px 0", fontWeight: 700, letterSpacing: "0.3px" },
    muted:{ color: "var(--paper-dim)", fontSize: "12px" },
    card: { background: "var(--ink)", border: "1px solid var(--hairline)", borderRadius: "10px", padding: "16px", marginBottom: "12px" },
    btn:  (bg, color, border) => ({ background: bg || "transparent", color: color || "var(--paper)", border: `1px solid ${border || "var(--hairline)"}`, padding: "11px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "'JetBrains Mono',monospace", display: "inline-block" }),
    tag:  (col) => ({ color: col, border: `1px solid ${col}55`, padding: "2px 8px", borderRadius: "4px", fontSize: "10px", display: "inline-block" }),
    back: { background: "transparent", border: "1px solid var(--hairline)", color: "#6b6a76", padding: "7px 13px", borderRadius: "7px", cursor: "pointer", fontSize: "11px", fontFamily: "'JetBrains Mono',monospace" },
  };

  // ── HOME ──
  if (screen === "home") return (
    <div style={S.page} className="screen-enter" key={screenKey}>
      <div style={{ textAlign: "center", padding: "16px 0 28px" }}>
        <div className="ember-pulse" style={{ width: "34px", height: "2px", background: "var(--ember)", margin: "0 auto 18px" }} />
        <div style={{ ...S.h1, fontSize: "30px", letterSpacing: "3px" }}>EA TRADING DOJO</div>
        <div style={{ color: "var(--paper-dim)", fontSize: "12px", marginTop: "7px", letterSpacing: "0.3px" }}>道場 · learn by doing, not by reading</div>

        {/* Belt rack overview */}
        <div style={{ marginTop: "22px", background: "var(--ink)", border: "1px solid var(--hairline)", borderRadius: "12px", padding: "18px 16px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "13px" }}>
            <Eyebrow>Belt Progress</Eyebrow>
            <span style={{ color: "var(--paper)", fontSize: "13px" }}>{totalDone}/{allDrills.length} drills</span>
          </div>
          <div style={{ display: "flex", gap: "5px" }}>
            {LEVELS.map(lv => {
              const p = levelProg(lv);
              return (
                <div key={lv.id} style={{ flex: 1 }}>
                  <BeltBar color={lv.color} done={p.done} total={p.total} height="14px" />
                  <div style={{ textAlign: "center", marginTop: "5px", fontSize: "9px", color: p.done === p.total ? lv.color : "#48474f" }}>L{lv.id}</div>
                </div>
              );
            })}
          </div>
          <div style={{ color: "#52515c", fontSize: "11px", marginTop: "10px" }}>{totalPct}% of the way to black belt</div>
        </div>
      </div>

      {/* What is an EA — beginner explainer */}
      <div style={{ ...S.card, borderColor: "#FF7A3D2e" }}>
        <Eyebrow color="var(--ember)">What is an EA?</Eyebrow>
        <div style={{ color: "#b8b7c0", fontSize: "13px", lineHeight: 1.7, marginTop: "9px" }}>
          An <strong style={{ color: "var(--paper)" }}>Expert Advisor (EA)</strong> is a program that runs inside MetaTrader 5 and trades automatically — no clicking required. You write the rules, the EA executes them 24/7.<br /><br />
          This dojo teaches you to <strong style={{ color: "var(--paper)" }}>build, test, and run real EAs</strong> through hands-on drills — not lectures. Each one takes 20–60 minutes and produces something real.
        </div>
      </div>

      {/* New vs experienced path selector */}
      <div style={{ ...S.card, borderColor: "#4D8FE82e", background: "#0d121c" }}>
        <Eyebrow color="#4D8FE8">New to trading?</Eyebrow>
        <div style={{ color: "#b8b7c0", fontSize: "12px", lineHeight: 1.6, margin: "9px 0 14px" }}>
          If you've never placed a manual trade or opened a demo account, start at L0 — spread, demo setup, and position sizing by hand, before any bot logic.
        </div>
        <button className="dojo-press" onClick={() => { setActiveLevel(0); setScreen("levels"); }}
          style={{ ...S.btn("#4D8FE81a", "#4D8FE8", "#4D8FE855"), width: "100%", padding: "12px", fontSize: "13px" }}>
          Step onto the mat at L0 →
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button className="dojo-press" onClick={() => setScreen("levels")}
          style={{ ...S.btn("var(--ember)", "#0a0a0f", "var(--ember)"), width: "100%", padding: "15px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.4px" }}>
          始める — START TRAINING
        </button>
        <button className="dojo-press" onClick={() => setScreen("glossary")} style={{ ...S.btn("", "#9c9ba6", "var(--hairline)"), width: "100%", padding: "12px" }}>
          Glossary — trading terms
        </button>
        <button className="dojo-press" onClick={() => { setActiveDrill(null); setAiReply(""); setAiQuestion(""); setScreen("ai"); }}
          style={{ ...S.btn("", "#A78BFA", "#3a2f55"), width: "100%", padding: "12px" }}>
          Ask the Tutor
        </button>
      </div>

      <div style={{ marginTop: "26px", display: "flex", flexDirection: "column", gap: "9px" }}>
        <Eyebrow>The Path</Eyebrow>
        {LEVELS.map(lv => {
          const p = levelProg(lv);
          const masteredAll = p.done === p.total;
          return (
            <div key={lv.id} className="dojo-card dojo-press" onClick={() => { setActiveLevel(lv.id); setScreen("levels"); }}
              style={{ ...S.card, cursor: "pointer", display: "flex", alignItems: "center", gap: "14px", padding: "13px 14px", marginBottom: 0 }}>
              <span style={{ fontSize: "19px" }}>{lv.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: lv.color, fontSize: "10px", marginBottom: "3px", letterSpacing: "0.3px" }}>{lv.code} · {BELT_NAMES[lv.id].toUpperCase()}</div>
                <div style={{ color: "var(--paper)", fontSize: "13px", fontWeight: 600 }}>{lv.title}</div>
                <div style={{ marginTop: "7px" }}><BeltBar color={lv.color} done={p.done} total={p.total} /></div>
              </div>
              {masteredAll ? <Seal size={30} /> : <div style={{ color: "#3a3a44", fontSize: "15px" }}>›</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── GLOSSARY ──
  if (screen === "glossary") {
    const filtered = GLOSSARY.filter(g =>
      g.term.toLowerCase().includes(glossFilter.toLowerCase()) ||
      g.def.toLowerCase().includes(glossFilter.toLowerCase())
    );
    return (
      <div style={S.page} className="screen-enter" key={screenKey}>
        <button className="dojo-press" style={S.back} onClick={() => setScreen("home")}>← Home</button>
        <h1 style={{ ...S.h1, fontSize: "22px", marginTop: "18px" }}>Glossary</h1>
        <div style={{ color: "var(--paper-dim)", fontSize: "12px", marginBottom: "16px" }}>{GLOSSARY.length} trading & bot terms, plain-language</div>
        <input
          placeholder="Search terms…"
          value={glossFilter}
          onChange={e => setGlossFilter(e.target.value)}
          style={{ width: "100%", background: "var(--ink)", border: "1px solid var(--hairline)", borderRadius: "8px", color: "var(--paper)", padding: "11px 13px", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: "16px" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((g, i) => (
            <div key={i} style={S.card}>
              <div style={{ color: "var(--ember)", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>{g.term}</div>
              <div style={{ color: "#a8a7b2", fontSize: "12px", lineHeight: 1.6 }}>{g.def}</div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: "#444", fontSize: "13px", textAlign: "center", padding: "24px" }}>No terms match "{glossFilter}"</div>}
        </div>
      </div>
    );
  }

  // ── AI TUTOR ──
  if (screen === "ai") return (
    <div style={S.page} className="screen-enter" key={screenKey}>
      <button className="dojo-press" style={S.back} onClick={() => setScreen(activeDrill ? "drill" : "home")}>← Back</button>
      <h1 style={{ ...S.h1, fontSize: "22px", marginTop: "18px" }}>AI Tutor</h1>
      <div style={{ color: "var(--paper-dim)", fontSize: "12px", marginBottom: "16px" }}>
        Ask anything about EA trading, MQL5, indicators, or risk management.
      </div>
      <div style={{ ...S.card, borderColor: "#26263a" }}>
        <Eyebrow>Anthropic API key (stays on this device only)</Eyebrow>
        <div style={{ display: "flex", gap: "8px", marginTop: "9px" }}>
          <input type="password" placeholder="sk-ant-..." value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            style={{ flex: 1, background: "var(--void)", border: "1px solid var(--hairline)", borderRadius: "7px", color: "var(--paper)", padding: "9px 11px", fontSize: "12px", fontFamily: "inherit", outline: "none" }}
          />
          <button className="dojo-press" onClick={() => { try { localStorage.setItem("dojo-api-key", apiKeyInput); setAiReply(""); } catch {} }}
            style={{ ...S.btn("#A78BFA1f", "#A78BFA", "#A78BFA"), padding: "9px 15px", fontSize: "12px" }}>
            Save
          </button>
        </div>
        <div style={{ color: "#52515c", fontSize: "10px", marginTop: "9px" }}>Get a key at console.anthropic.com — needed since this app runs outside Claude.ai.</div>
      </div>
      {activeDrill && (
        <div style={{ ...S.card, borderColor: "#26263a", color: "#8c8b98", fontSize: "12px" }}>
          Context: Drill {activeDrill.id} — {activeDrill.title}
        </div>
      )}

      {/* Quick questions */}
      <div style={{ marginBottom: "14px" }}>
        <Eyebrow>Quick questions</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "9px" }}>
          {["What is a pip and how does it relate to profit/loss?", "Explain RSI in simple terms for a beginner", "What's the difference between a stop loss and a take profit?", "Why do backtests often outperform live trading?", "What is lot size and how do I choose it?"].map((q, i) => (
            <button key={i} className="dojo-press" onClick={() => setAiQuestion(q)}
              style={{ background: "var(--ink)", border: "1px solid var(--hairline)", color: "#b8b7c0", padding: "10px 13px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit", textAlign: "left" }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Type your question..."
        value={aiQuestion}
        onChange={e => setAiQuestion(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAI(); } }}
        style={{ width: "100%", background: "var(--ink)", border: "1px solid var(--hairline)", borderRadius: "8px", color: "var(--paper)", padding: "12px", fontSize: "13px", fontFamily: "inherit", resize: "vertical", minHeight: "80px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}
      />
      <button className="dojo-press" onClick={askAI} disabled={aiLoading || !aiQuestion.trim()}
        style={{ ...S.btn(aiLoading ? "#1b1b26" : "#A78BFA1f", "#A78BFA", "#A78BFA"), width: "100%", padding: "13px", opacity: aiLoading ? 0.7 : 1 }}>
        {aiLoading ? "Thinking..." : "Ask Tutor ↵"}
      </button>

      {aiLoading && (
        <div style={{ textAlign: "center", padding: "24px", color: "#52515c", fontSize: "13px" }}>
          ⏳ Generating response...
        </div>
      )}

      {aiReply && (
        <div style={{ marginTop: "16px", background: "#0d1712", border: "1px solid #1d3a26", borderRadius: "10px", padding: "16px" }}>
          <Eyebrow color="var(--jade)">Tutor response</Eyebrow>
          <div style={{ color: "#c9c8d2", fontSize: "13px", lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: "10px" }}>{aiReply}</div>
          <button className="dojo-press" onClick={() => { setAiQuestion(""); setAiReply(""); }}
            style={{ ...S.btn("", "#6b6a76", "var(--hairline)"), marginTop: "14px", fontSize: "11px", padding: "7px 13px" }}>
            Ask another question
          </button>
        </div>
      )}
    </div>
  );

  // ── LEVELS LIST ──
  if (screen === "levels") return (
    <div style={S.page} className="screen-enter" key={screenKey}>
      <button className="dojo-press" style={S.back} onClick={() => setScreen("home")}>← Home</button>

      {/* Level tabs */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "18px 0 10px" }}>
        {LEVELS.map(lv => {
          const p = levelProg(lv);
          const active = activeLevel === lv.id;
          return (
            <button key={lv.id} className="dojo-press" onClick={() => setActiveLevel(lv.id)} style={{
              background: active ? "var(--ink)" : "transparent",
              border: `1px solid ${active ? lv.color : "#222229"}`,
              color: active ? lv.color : "#48474f",
              padding: "8px 13px", borderRadius: "8px", cursor: "pointer",
              fontSize: "11px", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0
            }}>
              {lv.icon} L{lv.id} {p.done === p.total ? "✓" : `${p.done}/${p.total}`}
            </button>
          );
        })}
      </div>

      {/* Level header */}
      <div style={{ ...S.card, borderColor: `${level.color}40`, marginTop: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: level.color, fontSize: "10px", letterSpacing: "1.5px", marginBottom: "5px", textTransform: "uppercase" }}>
              {level.code} · {BELT_NAMES[level.id]}
            </div>
            <div style={{ ...S.h1, fontSize: "18px" }}>{level.title}</div>
            <div style={{ color: "#7d7c88", fontSize: "12px", marginTop: "3px" }}>{level.subtitle}</div>
          </div>
          <div style={{ fontSize: "19px", marginLeft: "12px" }}>{level.icon}</div>
        </div>
        <div style={{ color: "#a8a7b2", fontSize: "12px", lineHeight: 1.65, marginTop: "13px" }}>{level.description}</div>

        {/* What you learn */}
        <div style={{ marginTop: "13px", paddingTop: "13px", borderTop: "1px solid var(--hairline)" }}>
          <Eyebrow>You'll learn</Eyebrow>
          {level.whatYouLearn.map((item, i) => (
            <div key={i} style={{ color: "#8c8b98", fontSize: "11px", marginTop: "7px", paddingLeft: "14px", position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: level.color }}>→</span>{item}
            </div>
          ))}
        </div>

        {/* Belt progress */}
        <div style={{ marginTop: "14px" }}>
          <BeltBar color={level.color} done={levelProg(level).done} total={levelProg(level).total} height="10px" />
          <div style={{ color: "#52515c", fontSize: "11px", marginTop: "6px" }}>{levelProg(level).pct}% — {levelProg(level).done}/{levelProg(level).total} drills stamped</div>
        </div>
      </div>

      {/* Drills */}
      {level.drills.map((drill, idx) => {
        const tm = TYPE_META[drill.type];
        const done = completed[drill.id];
        const qs = quizStatus(drill);
        const hasNote = !!(notes[drill.id]?.trim());
        return (
          <div key={drill.id} className="dojo-card dojo-press" onClick={() => { setActiveDrill(drill); setShowConcept(false); setShowHint(false); setAiReply(""); setScreen("drill"); }}
            style={{ ...S.card, cursor: "pointer", borderColor: done ? "#2a4a36" : "var(--hairline)", background: done ? "#0e1712" : "var(--ink)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: "7px", alignItems: "center", flexWrap: "wrap", marginBottom: "7px" }}>
                <span style={{ color: tm.border, border: `1px solid ${tm.border}55`, padding: "2px 7px", borderRadius: "4px", fontSize: "10px" }}>{tm.label}</span>
                <span style={{ color: "#5c5b66", fontSize: "10px" }}>{drill.tag}</span>
                <span style={{ color: "#48474f", fontSize: "10px" }}>⏱ {drill.time}</span>
                {qs && <span style={{ color: qs.done ? "var(--jade)" : "#48474f", fontSize: "10px" }}>{qs.correct}/{qs.total} quiz</span>}
              </div>
              <div style={{ color: done ? "#9fd6ad" : "var(--paper)", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                {idx + 1}. {drill.title}
              </div>
              <div style={{ color: "#6b6a76", fontSize: "12px", lineHeight: 1.5 }}>
                {drill.objective.slice(0, 100)}{drill.objective.length > 100 ? "…" : ""}
              </div>
              {hasNote && (
                <div style={{ marginTop: "10px", padding: "8px 10px", background: "var(--void)", borderRadius: "6px", borderLeft: "2px solid #3a3a55", color: "#5c5b66", fontSize: "11px" }}>
                  {notes[drill.id].slice(0, 80)}{notes[drill.id].length > 80 ? "…" : ""}
                </div>
              )}
            </div>
            {done ? <Seal size={34} /> : <div style={{ color: "#3a3a44", fontSize: "15px", flexShrink: 0, marginTop: "2px" }}>›</div>}
          </div>
        );
      })}

      {/* Type legend */}
      <div style={{ ...S.card, marginTop: "16px" }}>
        <Eyebrow>Drill types</Eyebrow>
        <div style={{ marginTop: "10px" }}>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "7px" }}>
              <span style={{ color: v.border, fontSize: "11px", minWidth: "100px" }}>{v.label}</span>
              <span style={{ color: "#52515c", fontSize: "11px" }}>{v.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── DRILL DETAIL ──
  if (screen === "drill" && activeDrill) {
    const drill = activeDrill;
    const lv = LEVELS.find(l => l.drills.some(d => d.id === drill.id));
    const tm = TYPE_META[drill.type];
    const done = completed[drill.id];
    const qs = quizStatus(drill);
    const answers = quizState[drill.id] || {};

    return (
      <div style={S.page} className="screen-enter" key={screenKey}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button className="dojo-press" style={S.back} onClick={() => setScreen("levels")}>← Drills</button>
          <button className="dojo-press" style={{ ...S.back, color: "#A78BFA", borderColor: "#3a2f55" }}
            onClick={() => setScreen("ai")}>Ask Tutor</button>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ color: tm.border, border: `1px solid ${tm.border}55`, padding: "3px 9px", borderRadius: "4px", fontSize: "10px" }}>{tm.label}</span>
          {done && <Seal size={26} />}
        </div>
        <div style={{ display: "flex", gap: "9px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
          <span style={{ color: lv.color, fontSize: "11px" }}>{lv.code} · {BELT_NAMES[lv.id]}</span>
          <span style={{ color: "#3a3a44" }}>·</span>
          <span style={{ color: "#6b6a76", fontSize: "11px" }}>{drill.tag}</span>
          <span style={{ color: "#3a3a44" }}>·</span>
          <span style={{ color: "#5c5b66", fontSize: "11px" }}>⏱ {drill.time}</span>
        </div>
        <h1 style={{ ...S.h1, fontSize: "19px", marginBottom: "22px" }}>{drill.id}. {drill.title}</h1>

        {/* Concept toggle */}
        <div style={{ ...S.card, borderColor: "#3a2f55" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setShowConcept(!showConcept)}>
            <Eyebrow color="#A78BFA">Core concept</Eyebrow>
            <div style={{ color: "#48474f", fontSize: "12px" }}>{showConcept ? "▲ hide" : "▼ show"}</div>
          </div>
          {showConcept && (
            <div style={{ color: "#c0bfc9", fontSize: "13px", lineHeight: 1.7, marginTop: "12px" }}>{drill.concept}</div>
          )}
          {!showConcept && (
            <div style={{ color: "#5c5b66", fontSize: "12px", marginTop: "7px" }}>
              {drill.concept.slice(0, 70)}...
            </div>
          )}
        </div>

        {/* Objective */}
        <div style={S.card}>
          <Eyebrow>Objective</Eyebrow>
          <div style={{ color: "#e2e0d8", fontSize: "14px", lineHeight: 1.6, marginTop: "9px" }}>{drill.objective}</div>
        </div>

        {/* Task — terminal-style code panel */}
        <div style={{ ...S.card, padding: 0, overflow: "hidden", borderColor: "#1e3326" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 14px", borderBottom: "1px solid #1e3326", background: "#0c140e" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E5484D44" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8B33944" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CAF6D44" }} />
            <span style={{ color: "var(--jade)", fontSize: "10px", letterSpacing: "1.5px", marginLeft: "6px", textTransform: "uppercase" }}>Your task</span>
          </div>
          <pre style={{ color: "#cfceda", fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono',monospace", margin: 0, padding: "14px" }}>{drill.task}</pre>
        </div>

        {/* Deliverable */}
        <div style={{ ...S.card, borderColor: "#3a2f5550", background: "#100c1a" }}>
          <Eyebrow color="#A78BFA">Deliverable</Eyebrow>
          <div style={{ color: "#c9c8d2", fontSize: "13px", lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: "9px" }}>{drill.deliverable}</div>
        </div>

        {/* Hint toggle */}
        <div style={{ ...S.card, borderColor: "#3d3420" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setShowHint(!showHint)}>
            <Eyebrow color="var(--gold)">Hint — stuck? tap here</Eyebrow>
            <div style={{ color: "#48474f", fontSize: "12px" }}>{showHint ? "▲ hide" : "▼ show"}</div>
          </div>
          {showHint && (
            <div style={{ color: "#dcdae0", fontSize: "13px", lineHeight: 1.7, marginTop: "12px" }}>{drill.hint}</div>
          )}
        </div>

        {/* Quiz */}
        {drill.quiz && drill.quiz.length > 0 && (
          <div style={S.card}>
            <Eyebrow>Check your understanding {qs && `· ${qs.correct}/${qs.total}`}</Eyebrow>
            {drill.quiz.map((q, qIdx) => {
              const selected = answers[qIdx];
              return (
                <div key={qIdx} style={{ marginTop: "16px" }}>
                  <div style={{ color: "var(--paper)", fontSize: "13px", marginBottom: "9px", lineHeight: 1.5 }}>{qIdx + 1}. {q.q}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selected === opt;
                      const isCorrect = opt === q.a;
                      let borderColor = "#26262f", color = "#9c9ba6", bg = "transparent";
                      if (selected) {
                        if (isCorrect) { borderColor = "#2a4a36"; color = "#9fd6ad"; bg = "#0e1712"; }
                        else if (isSelected) { borderColor = "#4a2a2e"; color = "#e09aa0"; bg = "#170d0f"; }
                      }
                      return (
                        <button key={oIdx} className="dojo-press" onClick={() => answerQuiz(drill.id, qIdx, opt)}
                          style={{ textAlign: "left", background: bg, border: `1px solid ${borderColor}`, color, padding: "10px 13px", borderRadius: "7px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
                          {opt}{selected && isCorrect ? "  ✓" : ""}{selected && isSelected && !isCorrect ? "  ✗" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notes */}
        <div style={S.card}>
          <Eyebrow>Your notes</Eyebrow>
          <textarea
            placeholder="Paste your code, write your answers, jot down questions..."
            value={notes[drill.id] || ""}
            onChange={e => saveNote(drill.id, e.target.value)}
            style={{ width: "100%", background: "var(--void)", border: "1px solid var(--hairline)", borderRadius: "8px", color: "var(--paper)", padding: "11px 13px", fontSize: "12px", fontFamily: "inherit", resize: "vertical", minHeight: "100px", outline: "none", boxSizing: "border-box", marginTop: "9px" }}
          />
        </div>

        {/* Complete toggle */}
        <button className="dojo-press" onClick={() => markComplete(drill.id)}
          style={{ ...S.btn(done ? "#4CAF6D1f" : "transparent", done ? "var(--jade)" : "#9c9ba6", done ? "var(--jade)" : "var(--hairline)"), width: "100%", padding: "15px", fontSize: "14px", fontWeight: 700 }}>
          {done ? "Stamped complete — tap to undo" : "Mark as complete"}
        </button>
      </div>
    );
  }

  return null;
}

window.EATradingDojo = EATradingDojo;

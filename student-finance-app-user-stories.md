# Student Finance App — Market Research & User Stories

## 1. Research Summary

**What student-focused budgeting apps do well (YNAB, Goodbudget, PocketGuard, Splitwise, Finny, Rocket Money):**
- Handle **irregular/lump-sum income** — students get money in chunks (allowance, loan disbursement, part-time paycheck), not steady salaries, so budgets need to work off a "assign every dollar a job" or envelope model rather than assuming monthly recurring income.
- **No-bank-sync option** — many students don't want to link a bank account (privacy, or don't have a card/bank account tied to the app's supported region). Manual entry is a first-class path, not a fallback.
- **Roommate/shared-expense splitting** — rent, utilities, groceries, streaming subscriptions are the most common student shared costs. This is consistently the #1 requested feature distinct from generic personal budgeting.
- **Low-friction expense entry** — voice entry, receipt photo scanning, quick-add presets — because students won't tolerate a multi-step form for a $3 coffee.
- **Subscription/recurring-charge detection** — flagging forgotten subscriptions is a specific pain point for students on tight, fixed budgets.
- **Gamification** — streaks, points, badges, and light "challenges" measurably increase engagement and habit formation for younger users; several apps report this as their main retention lever.
- **Offline-first with sync** — relevant on campus with unreliable Wi-Fi.

**What core banking apps do well (Revolut, Monzo, Chime, Nubank — general banking UX best practice):**
- **Dashboard-first design**: balance, recent activity, and the one primary action ("Add expense" / "Transfer") get top visual priority — everything else is secondary.
- **Bottom navigation, not hamburger menus** — 4–5 top-level tabs so core actions are always one tap away.
- Real-time push notifications for transactions, low balance, and security events.
- Biometric authentication and app lock as a baseline expectation, not a premium feature.
- Personalization ("you spent 20% more on food this week") delivered as small, non-intrusive nudges rather than dense reports.

**Gaps specific to the student segment (not just "budgeting app + students" but genuinely student-shaped problems):**
- Tuition/semester-based cash flow (large lump payments, then a long stretch of no income) is different from monthly salary budgeting most apps assume.
- Financial-aid/scholarship/loan disbursement tracking is a distinct money source most general apps don't model well.
- Peer-group money (splitting a group dinner, chipping in for a trip, IOUs between friends) blends budgeting with lightweight social payments.
- Financial literacy is often bundled in for this age group (quizzes, "money 101" content) because it's frequently many users' first time managing money independently.

---

## 2. User Stories

Organized by epic. Format: *As a [user], I want to [action], so that [benefit].*

### Epic A — Onboarding & Account
1. As a new user, I want to sign up with just my email or phone number, so that I can start using the app without friction.
2. As a student, I want to select my income pattern (e.g., monthly allowance, part-time job, semester lump sum, no steady income), so that the app builds a budget model that fits how I actually get money.
3. As a user, I want to choose whether to manually enter transactions or link a bank/e-wallet account, so that I control how much financial data I share.
4. As a new user, I want a short guided setup (set a starting balance, pick a few spending categories, set one goal), so that I see value in the first two minutes.
5. As a user, I want to enable biometric login (Face ID/fingerprint) and a PIN lock, so that my financial data stays secure on a shared or borrowed device.

### Epic B — Dashboard
6. As a user, I want to see my current balance, this month's spending vs. budget, and recent transactions on one home screen, so that I know my financial status at a glance.
7. As a user, I want a single, obvious "Add transaction" button always visible, so that logging an expense takes one tap.
8. As a user, I want to see how many days are left until my next expected income (allowance, paycheck, loan disbursement), so that I can pace my remaining spending.
9. As a user, I want a quick visual (progress bar or ring) for my monthly budget usage, so that I instantly know if I'm on track, close to the limit, or over.

### Epic C — Expense & Income Tracking
10. As a user, I want to log an expense in under 10 seconds (amount, category, optional note), so that I actually keep tracking instead of giving up.
11. As a user, I want to scan a receipt with my camera and have the amount/merchant auto-filled, so that I don't have to type everything manually.
12. As a user, I want to categorize income by source (allowance, part-time job, scholarship, loan disbursement, gift), so that I can see where my money actually comes from.
13. As a user, I want to mark a transaction as recurring (rent, subscription, gym), so that it's automatically tracked each period without re-entering it.
14. As a user, I want to see all my active subscriptions in one place with their renewal dates and total monthly cost, so that I can spot ones I forgot to cancel.
15. As a user, I want to search and filter my transaction history by category, date, or amount, so that I can find a specific past expense quickly.
16. As a user, I want to undo or edit a transaction I entered by mistake, so that my records stay accurate without hassle.

### Epic D — Budgeting
17. As a user, I want to set an overall monthly spending limit and per-category limits (food, transport, entertainment), so that I can control spending in the areas that matter most.
18. As a user, I want the app to warn me when I'm close to (e.g., 80%) or over a category budget, so that I can adjust before I overspend.
19. As a student with irregular income, I want to build a budget for a semester or a lump sum rather than a fixed calendar month, so that the budget matches how my money actually arrives.
20. As a user, I want to see a comparison of budgeted vs. actual spending at the end of each period, so that I can adjust next period's budget realistically.
21. As a user with no income yet, I want a "fixed expenses first, then a weekly spending cap on what's left" budgeting mode, so that I have a workable plan even without a steady income to build around.

### Epic E — Shared / Roommate Expenses
22. As a student living with roommates, I want to create a shared group and split an expense (rent, utilities, groceries) equally or by custom shares, so that everyone's owed amount is calculated automatically.
23. As a user in a shared group, I want to see a running "who owes whom" balance for the group, so that I don't have to track IOUs manually.
24. As a user, I want to record a settle-up payment between me and a roommate/friend, so that the group balance updates and disputes are avoided.
25. As a user, I want to split a one-off group expense (dinner, trip) outside of any recurring group, so that I can settle casual shared costs without setting up a permanent group.
26. As a group member, I want a notification when someone adds a new shared expense or settles a debt, so that I stay updated without opening the app.

### Epic F — Savings Goals & Financial Aid
27. As a student, I want to create a savings goal (e.g., "new laptop", "summer trip") with a target amount and date, so that I can track progress toward something specific.
28. As a user, I want to log scholarship or financial-aid disbursements as a distinct income type with their own disbursement schedule, so that I can plan around when that money actually arrives.
29. As a student with a loan, I want to track my loan balance and repayment schedule (even if repayment hasn't started), so that I understand my future obligations early.
30. As a user, I want the app to suggest how much to set aside per week/month to hit a savings goal by its target date, so that I don't have to do the math myself.

### Epic G — Insights, Notifications & Literacy
31. As a user, I want a weekly or monthly summary notification of my spending by category, so that I get periodic insight without having to check the app daily.
32. As a user, I want a low-balance alert before I run out of money, so that I can adjust spending in time.
33. As a user, I want gamified elements (streaks for daily logging, small badges/points for staying under budget), so that tracking my finances feels rewarding rather than like a chore.
34. As a student new to managing money, I want short, optional lessons or tips on budgeting basics (e.g., what an emergency fund is, how interest works), so that I build financial literacy alongside tracking my spending.
35. As a user, I want to see a simple trend chart of my spending or savings over the past few months, so that I can tell if my habits are improving.

### Epic H — Data, Export & Trust
36. As a user, I want to export my transaction history as CSV, so that I can back it up or use it elsewhere (e.g., for a scholarship application or personal records).
37. As a user, I want to know exactly what data is shared if I link a bank account, and be able to unlink it at any time, so that I trust the app with my financial information.
38. As a user, I want the app to work offline and sync automatically when I'm back online, so that I can log expenses even with unreliable campus Wi-Fi.

---

## 3. Suggested MVP Slice

Given your stack context (React Native/Expo app, separate from Wallo), a reasonable v1 cut from the above:
- **Must-have**: Epics A, B, C (minus receipt scanning), D (minus semester-based budgeting), basic notifications from G (low-balance, weekly summary).
- **Strong differentiator for this segment**: Epic E (shared/roommate expenses) — this is the clearest gap vs. generic budgeting apps and vs. what Wallo already covers.
- **v2+**: receipt scanning, gamification, financial literacy content, loan/financial-aid tracking, semester-based budgeting logic, bank linking.

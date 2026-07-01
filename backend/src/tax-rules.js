/**
 * TaxPilot Copilot — Tax Rules Knowledge Base
 *
 * Curated knowledge base of Indian Income Tax rules for RAG retrieval.
 * Each entry is tagged with topics for keyword-based matching against
 * the current page context.
 *
 * Categories: income, deduction, tds, regime, personal, filing
 */

const TAX_RULES = [
  // ═══════════════════════════════════════════════════════════
  // INCOME
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rule_salary_income',
    topics: ['salary', 'gross salary', 'income from salary', 'income under head salaries', 'salary income', 'basic salary', 'pay'],
    section: 'Section 17(1)',
    title: 'Salary Income — What Constitutes Salary',
    content: 'Salary includes basic salary, advance salary, arrears of salary, leave encashment, gratuity, pension, annuity, commission, fees, bonus, perquisites, and profits in lieu of salary. The total of all these components forms the gross salary under Section 17(1). Salary is taxable on due basis or receipt basis, whichever is earlier.',
    source: 'Income Tax Act, 1961 — Section 17(1)',
    category: 'income',
  },
  {
    id: 'rule_allowances',
    topics: ['allowance', 'hra', 'house rent allowance', 'dearness allowance', 'transport allowance', 'special allowance', 'city compensatory allowance'],
    section: 'Section 10',
    title: 'Allowances — Taxable and Exempt',
    content: 'Allowances like Dearness Allowance and City Compensatory Allowance are fully taxable. HRA is partially exempt under Section 10(13A) if the employee pays rent. Transport allowance up to ₹1,600/month is exempt for physically disabled persons. Special allowances are generally fully taxable unless specifically exempted.',
    source: 'Income Tax Act, 1961 — Section 10',
    category: 'income',
  },
  {
    id: 'rule_hra_exemption',
    topics: ['hra', 'house rent allowance', 'hra exemption', 'hra calculation', 'rent paid', 'section 10(13a)', 'metro', 'non-metro'],
    section: 'Section 10(13A)',
    title: 'HRA Exemption Calculation',
    content: 'HRA exemption is the minimum of: (a) Actual HRA received, (b) 50% of salary for metro cities (Delhi, Mumbai, Kolkata, Chennai) or 40% for non-metro, (c) Rent paid minus 10% of salary. Salary here means Basic + DA. The exemption is only available under the Old Tax Regime. Under the New Regime (Section 115BAC), HRA exemption is NOT available.',
    source: 'Income Tax Act, 1961 — Section 10(13A), Rule 2A',
    category: 'income',
  },
  {
    id: 'rule_perquisites',
    topics: ['perquisite', 'perquisites', 'rent free accommodation', 'company car', 'esop', 'stock options', 'sweat equity'],
    section: 'Section 17(2)',
    title: 'Perquisites — Non-Cash Benefits',
    content: 'Perquisites are non-cash benefits provided by an employer. They include rent-free accommodation, company car for personal use, interest-free loans, ESOPs/stock options, and club memberships. Perquisites are valued as per prescribed rules and added to gross salary. Certain perquisites like medical reimbursement up to ₹15,000 may be exempt.',
    source: 'Income Tax Act, 1961 — Section 17(2)',
    category: 'income',
  },
  {
    id: 'rule_standard_deduction',
    topics: ['standard deduction', 'deduction from salary', '50000', '75000', 'section 16'],
    section: 'Section 16(ia)',
    title: 'Standard Deduction from Salary',
    content: 'A flat standard deduction of ₹75,000 (from AY 2025-26 onwards, raised from ₹50,000) is available from salary income under both Old and New Tax Regimes. No proof or documentation is required. This is automatically deducted from gross salary to arrive at net taxable salary income. For pensioners, the same deduction applies to pension income.',
    source: 'Income Tax Act, 1961 — Section 16(ia), Budget 2024',
    category: 'income',
  },
  {
    id: 'rule_professional_tax',
    topics: ['professional tax', 'profession tax', 'employment tax', 'section 16(iii)', 'state tax'],
    section: 'Section 16(iii)',
    title: 'Professional Tax Deduction',
    content: 'Professional tax paid to the state government is allowed as a deduction from salary income under Section 16(iii). The maximum professional tax in India is ₹2,500 per year. This deduction is available under both Old and New Tax Regimes.',
    source: 'Income Tax Act, 1961 — Section 16(iii)',
    category: 'income',
  },
  {
    id: 'rule_income_other_sources',
    topics: ['income from other sources', 'interest income', 'savings bank', 'fixed deposit', 'fd interest', 'dividend', 'other sources'],
    section: 'Section 56',
    title: 'Income from Other Sources',
    content: 'Income from other sources includes interest from savings bank accounts, fixed deposits, recurring deposits, post office schemes, dividends from shares/mutual funds, lottery/gambling winnings, gifts above ₹50,000, and any income not classifiable under other heads. Interest from savings bank accounts up to ₹10,000 is exempt under Section 80TTA (Old Regime).',
    source: 'Income Tax Act, 1961 — Section 56',
    category: 'income',
  },
  {
    id: 'rule_house_property',
    topics: ['house property', 'income from house property', 'rental income', 'self-occupied', 'let out', 'home loan interest', 'section 24'],
    section: 'Section 22-27',
    title: 'Income from House Property',
    content: 'For self-occupied property, no income is taxable but interest on home loan up to ₹2,00,000 is deductible under Section 24(b) under Old Regime. For let-out property, rental income minus municipal taxes is the Gross Annual Value. Standard deduction of 30% is allowed, plus home loan interest with no upper limit for let-out property.',
    source: 'Income Tax Act, 1961 — Sections 22-27',
    category: 'income',
  },
  {
    id: 'rule_capital_gains',
    topics: ['capital gains', 'short term capital gains', 'long term capital gains', 'stcg', 'ltcg', 'shares', 'mutual funds', 'property sale'],
    section: 'Section 45',
    title: 'Capital Gains',
    content: 'Capital gains arise from sale of capital assets. Short-term capital gains (STCG) on equity shares/equity mutual funds are taxed at 20% (from July 2024). Long-term capital gains (LTCG) on equity exceeding ₹1,25,000 are taxed at 12.5%. For other assets, STCG is taxed at slab rates and LTCG at 12.5% without indexation.',
    source: 'Income Tax Act, 1961 — Section 45, Budget 2024',
    category: 'income',
  },
  {
    id: 'rule_exempt_income',
    topics: ['exempt income', 'exemption', 'agricultural income', 'ppf interest', 'epf', 'gratuity exemption', 'leave encashment'],
    section: 'Section 10',
    title: 'Common Exempt Incomes',
    content: 'Key exempt incomes include: agricultural income (Section 10(1)), PPF interest and maturity (Section 10(11)), EPF withdrawal after 5 years (Section 10(12)), gratuity up to ₹20 lakh for non-government employees (Section 10(10)), leave encashment up to ₹25 lakh on retirement (Section 10(10AA)), and scholarships (Section 10(16)).',
    source: 'Income Tax Act, 1961 — Section 10',
    category: 'income',
  },

  // ═══════════════════════════════════════════════════════════
  // DEDUCTIONS
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rule_80c',
    topics: ['80c', 'section 80c', 'deduction', 'elss', 'ppf', 'epf', 'life insurance', 'nsc', 'tax saving', 'tuition fees', 'home loan principal', 'sukanya samriddhi'],
    section: 'Section 80C',
    title: 'Section 80C — Tax Saving Investments',
    content: 'Section 80C allows a maximum deduction of ₹1,50,000 for investments in PPF, EPF (employee contribution), ELSS mutual funds, life insurance premium, NSC, 5-year FD, tuition fees (max 2 children), home loan principal repayment, Sukanya Samriddhi Yojana, and senior citizen savings scheme. This deduction is ONLY available under the Old Tax Regime.',
    source: 'Income Tax Act, 1961 — Section 80C',
    category: 'deduction',
  },
  {
    id: 'rule_80ccd_nps',
    topics: ['80ccd', 'nps', 'national pension', 'pension scheme', '80ccd(1b)', '80ccd(2)', 'additional nps', 'employer nps'],
    section: 'Section 80CCD',
    title: 'NPS Deductions',
    content: 'Section 80CCD(1): Employee contribution to NPS up to 10% of salary, within ₹1,50,000 limit of 80C. Section 80CCD(1B): Additional deduction of ₹50,000 for NPS investment (over and above 80C limit) — Old Regime only. Section 80CCD(2): Employer contribution to NPS up to 14% of salary (central govt) or 10% (others) — available under BOTH regimes.',
    source: 'Income Tax Act, 1961 — Section 80CCD',
    category: 'deduction',
  },
  {
    id: 'rule_80d',
    topics: ['80d', 'section 80d', 'health insurance', 'medical insurance', 'mediclaim', 'health check', 'preventive health'],
    section: 'Section 80D',
    title: 'Section 80D — Health Insurance Premium',
    content: 'Deduction for health insurance premium: up to ₹25,000 for self/spouse/children, additional ₹25,000 for parents (₹50,000 if parents are senior citizens). Maximum total: ₹1,00,000 if all are senior citizens. Includes preventive health check-up up to ₹5,000. Only available under the Old Tax Regime.',
    source: 'Income Tax Act, 1961 — Section 80D',
    category: 'deduction',
  },
  {
    id: 'rule_80e',
    topics: ['80e', 'section 80e', 'education loan', 'education loan interest', 'higher education'],
    section: 'Section 80E',
    title: 'Section 80E — Education Loan Interest',
    content: 'Interest paid on education loan for higher education (self, spouse, children, or student for whom taxpayer is legal guardian) is fully deductible with no upper limit. Available for 8 consecutive years from the year repayment starts. Only available under the Old Tax Regime.',
    source: 'Income Tax Act, 1961 — Section 80E',
    category: 'deduction',
  },
  {
    id: 'rule_80g',
    topics: ['80g', 'section 80g', 'donation', 'charitable donation', 'pm cares', 'pm relief fund'],
    section: 'Section 80G',
    title: 'Section 80G — Donations to Charitable Institutions',
    content: 'Donations to specified funds/institutions qualify for deduction: 100% deduction for PM National Relief Fund, PM CARES Fund, and certain national funds. 50% deduction for other approved charitable institutions, subject to 10% of adjusted gross total income. Receipt from the donee is mandatory. Only available under the Old Tax Regime.',
    source: 'Income Tax Act, 1961 — Section 80G',
    category: 'deduction',
  },
  {
    id: 'rule_80tta',
    topics: ['80tta', 'section 80tta', 'savings account interest', 'savings bank interest', '10000'],
    section: 'Section 80TTA',
    title: 'Section 80TTA — Savings Account Interest',
    content: 'Interest earned on savings bank accounts up to ₹10,000 per year is deductible under Section 80TTA. This applies to savings accounts in banks, post offices, and cooperative societies. Does NOT apply to fixed deposit interest. For senior citizens, Section 80TTB provides ₹50,000 deduction on all deposit interest. Only available under the Old Tax Regime.',
    source: 'Income Tax Act, 1961 — Section 80TTA/80TTB',
    category: 'deduction',
  },
  {
    id: 'rule_home_loan_interest',
    topics: ['home loan', 'housing loan', 'section 24', 'interest on home loan', 'home loan interest', '24b', 'section 24(b)'],
    section: 'Section 24(b)',
    title: 'Home Loan Interest Deduction',
    content: 'Interest on housing loan for self-occupied property: maximum deduction of ₹2,00,000 per year under Section 24(b). For let-out property, there is no upper limit on interest deduction. Under the New Tax Regime, this deduction is NOT available for self-occupied property but is available for let-out property.',
    source: 'Income Tax Act, 1961 — Section 24(b)',
    category: 'deduction',
  },
  {
    id: 'rule_80dd',
    topics: ['80dd', 'section 80dd', 'disabled dependent', 'disability', 'handicapped'],
    section: 'Section 80DD',
    title: 'Section 80DD — Disabled Dependent',
    content: 'Deduction for maintenance and medical treatment of disabled dependent (spouse, children, parents, siblings): ₹75,000 for 40%+ disability, ₹1,25,000 for 80%+ severe disability. Certificate from prescribed medical authority required. Only available under the Old Tax Regime.',
    source: 'Income Tax Act, 1961 — Section 80DD',
    category: 'deduction',
  },
  {
    id: 'rule_80u',
    topics: ['80u', 'section 80u', 'self disability', 'person with disability'],
    section: 'Section 80U',
    title: 'Section 80U — Self Disability',
    content: 'Deduction for taxpayer who themselves is a person with disability: ₹75,000 for 40%+ disability, ₹1,25,000 for 80%+ severe disability. Certificate from prescribed medical authority required. Only available under the Old Tax Regime.',
    source: 'Income Tax Act, 1961 — Section 80U',
    category: 'deduction',
  },
  {
    id: 'rule_80ddb',
    topics: ['80ddb', 'section 80ddb', 'specified disease', 'medical treatment', 'critical illness'],
    section: 'Section 80DDB',
    title: 'Section 80DDB — Treatment of Specified Diseases',
    content: 'Deduction for medical treatment of specified diseases (cancer, AIDS, neurological diseases, etc.) for self or dependent: up to ₹40,000 (₹1,00,000 for senior citizens). Requires prescription from a specialist. Only available under the Old Tax Regime.',
    source: 'Income Tax Act, 1961 — Section 80DDB',
    category: 'deduction',
  },

  // ═══════════════════════════════════════════════════════════
  // TAX REGIME
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rule_new_regime',
    topics: ['new tax regime', 'new regime', '115bac', 'section 115bac', 'default regime', 'opt out', 'tax regime selection'],
    section: 'Section 115BAC',
    title: 'New Tax Regime (Default)',
    content: 'The New Tax Regime under Section 115BAC is the DEFAULT regime from AY 2024-25 onwards. Tax slabs: ₹0-3L = Nil, ₹3-7L = 5%, ₹7-10L = 10%, ₹10-12L = 15%, ₹12-15L = 20%, Above ₹15L = 30%. Standard deduction of ₹75,000 and employer NPS contribution (80CCD(2)) are allowed. Most other deductions/exemptions (80C, 80D, HRA, etc.) are NOT available.',
    source: 'Income Tax Act, 1961 — Section 115BAC, Budget 2024',
    category: 'regime',
  },
  {
    id: 'rule_old_regime',
    topics: ['old tax regime', 'old regime', 'regular regime', 'opt for old', 'regime comparison', 'which regime'],
    section: 'Section 115BAC (opt-out)',
    title: 'Old Tax Regime',
    content: 'The Old Tax Regime offers higher tax rates but allows all deductions and exemptions. Tax slabs: ₹0-2.5L = Nil, ₹2.5-5L = 5%, ₹5-10L = 20%, Above ₹10L = 30%. All deductions under 80C, 80D, 80E, 80G, HRA exemption, LTA, home loan interest etc. are available. Salaried individuals must opt out of the New Regime before filing ITR. The Old Regime is generally better if total deductions exceed ₹3.75 lakh.',
    source: 'Income Tax Act, 1961',
    category: 'regime',
  },
  {
    id: 'rule_regime_switching',
    topics: ['switch regime', 'change regime', 'opt out new regime', 'regime change', 'form 10ie', 'form 10-ie'],
    section: 'Section 115BAC(6)',
    title: 'Switching Between Tax Regimes',
    content: 'Salaried individuals (no business income) can switch between Old and New regimes every year at the time of filing ITR. They need to indicate their choice in the ITR form. No Form 10-IE is needed for salaried persons. Individuals with business income must file Form 10-IE to opt out of the New Regime, and once opted out, can switch back only once in their lifetime.',
    source: 'Income Tax Act, 1961 — Section 115BAC(6)',
    category: 'regime',
  },
  {
    id: 'rule_rebate_87a',
    topics: ['rebate', '87a', 'section 87a', 'tax rebate', 'nil tax', 'zero tax', '7 lakh', '5 lakh'],
    section: 'Section 87A',
    title: 'Tax Rebate under Section 87A',
    content: 'Under the New Regime: Full tax rebate if total income is up to ₹7,00,000 — effectively zero tax. Under the Old Regime: Tax rebate of up to ₹12,500 if total income is up to ₹5,00,000. The rebate is applicable only for resident individuals. Income above these thresholds is taxed normally — there is no marginal relief.',
    source: 'Income Tax Act, 1961 — Section 87A',
    category: 'regime',
  },
  {
    id: 'rule_surcharge',
    topics: ['surcharge', 'cess', 'health and education cess', '4% cess', 'surcharge rate'],
    section: 'Section 2(10A)',
    title: 'Surcharge and Cess',
    content: 'Health and Education Cess of 4% is levied on total tax + surcharge. Surcharge rates for individuals: 10% for income ₹50L-1Cr, 15% for ₹1Cr-2Cr, 25% for ₹2Cr-5Cr, 37% for above ₹5Cr. Under New Regime, maximum surcharge is capped at 25%. Total tax liability = Tax + Surcharge + Cess.',
    source: 'Finance Act — Applicable rates',
    category: 'regime',
  },

  // ═══════════════════════════════════════════════════════════
  // TDS
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rule_tds_salary',
    topics: ['tds', 'tds on salary', 'tax deducted at source', 'employer tds', 'section 192', 'tds deduction'],
    section: 'Section 192',
    title: 'TDS on Salary',
    content: 'Employers must deduct TDS on salary under Section 192 based on the estimated annual income and applicable tax slab. The employer considers declared investments (under 80C, 80D, etc.) and HRA claims. TDS is deducted monthly. The total TDS should roughly equal the total tax liability. Form 16 Part A shows the TDS details.',
    source: 'Income Tax Act, 1961 — Section 192',
    category: 'tds',
  },
  {
    id: 'rule_form16',
    topics: ['form 16', 'form-16', 'form16', 'part a', 'part b', 'salary certificate', 'tds certificate'],
    section: 'Section 203',
    title: 'Form 16 — TDS Certificate for Salary',
    content: 'Form 16 is the TDS certificate issued by the employer. Part A contains: employer/employee details, PAN, TAN, TDS deducted and deposited quarter-wise. Part B contains: detailed salary breakup, allowances, perquisites, deductions claimed, and tax computation. The values in Part B should match exactly with the ITR salary schedule. Form 16 must be issued by June 15 of the assessment year.',
    source: 'Income Tax Act, 1961 — Section 203, Rule 31',
    category: 'tds',
  },
  {
    id: 'rule_form26as',
    topics: ['form 26as', '26as', 'tax credit', 'tds credit', 'annual information statement', 'ais'],
    section: 'Section 203AA',
    title: 'Form 26AS and Annual Information Statement',
    content: 'Form 26AS (Annual Tax Statement) shows all TDS/TCS credits, advance tax paid, self-assessment tax paid, and refunds for the financial year. The Annual Information Statement (AIS) additionally shows financial transactions like savings interest, property transactions, mutual fund purchases. TDS claimed in ITR must match Form 26AS exactly, otherwise processing will flag a mismatch.',
    source: 'Income Tax Act, 1961 — Section 203AA',
    category: 'tds',
  },
  {
    id: 'rule_advance_tax',
    topics: ['advance tax', 'self assessment tax', 'section 234b', 'section 234c', 'interest on late payment'],
    section: 'Section 208-211',
    title: 'Advance Tax',
    content: 'If total tax liability exceeds ₹10,000 in a year, advance tax must be paid in instalments: 15% by June 15, 45% by Sep 15, 75% by Dec 15, 100% by Mar 15. Salaried individuals whose TDS covers most of their tax are usually exempt. Failure to pay attracts interest under Section 234B (non-payment) and 234C (deferment).',
    source: 'Income Tax Act, 1961 — Sections 208-211',
    category: 'tds',
  },
  {
    id: 'rule_tds_interest',
    topics: ['tds interest', 'interest on deposits', 'section 194a', 'section 193', 'tds on fd', 'tds on interest'],
    section: 'Section 194A',
    title: 'TDS on Interest Income',
    content: 'Banks deduct TDS at 10% on interest from fixed deposits if annual interest exceeds ₹40,000 (₹50,000 for senior citizens). If PAN is not provided, TDS rate is 20%. Form 15G/15H can be submitted to avoid TDS if total income is below taxable limit. This TDS appears in Form 26AS and should be claimed in the ITR.',
    source: 'Income Tax Act, 1961 — Section 194A',
    category: 'tds',
  },

  // ═══════════════════════════════════════════════════════════
  // PERSONAL DETAILS
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rule_pan',
    topics: ['pan', 'permanent account number', 'pan card', 'pan number', 'pan validation'],
    section: 'Section 139A',
    title: 'PAN — Permanent Account Number',
    content: 'PAN is a 10-character alphanumeric identifier (e.g., ABCDE1234F). It is mandatory for filing ITR, TDS credits, and most financial transactions above specified limits. The PAN in the ITR must match the PAN on Form 16 and Form 26AS. A mismatch will cause TDS credit to not reflect, leading to demand notices.',
    source: 'Income Tax Act, 1961 — Section 139A',
    category: 'personal',
  },
  {
    id: 'rule_residential_status',
    topics: ['residential status', 'resident', 'non-resident', 'nri', 'rnor', 'not ordinarily resident', 'days in india', '182 days'],
    section: 'Section 6',
    title: 'Residential Status',
    content: 'An individual is Resident if present in India for 182+ days in the FY, or 60+ days in the FY AND 365+ days in preceding 4 FYs. Residents are taxed on worldwide income. Non-Residents (NRI) are taxed only on Indian income. RNOR (Resident but Not Ordinarily Resident) have special rules. Most salaried employees filing ITR in India are Ordinary Residents.',
    source: 'Income Tax Act, 1961 — Section 6',
    category: 'personal',
  },
  {
    id: 'rule_assessment_year',
    topics: ['assessment year', 'ay', 'financial year', 'fy', 'previous year', 'ay 2025-26', 'fy 2024-25', 'ay 2026-27', 'fy 2025-26'],
    section: 'Section 2(9)',
    title: 'Assessment Year vs Financial Year',
    content: 'Financial Year (FY) is the year in which income is earned (April to March). Assessment Year (AY) is the next year in which that income is assessed/filed. For example: income earned in FY 2025-26 (April 2025 – March 2026) is filed in AY 2026-27. Always ensure the correct AY is selected in the ITR form — selecting the wrong AY is a common mistake.',
    source: 'Income Tax Act, 1961 — Section 2(9)',
    category: 'personal',
  },
  {
    id: 'rule_bank_account',
    topics: ['bank account', 'refund bank account', 'ifsc', 'bank details', 'pre-validated', 'refund'],
    section: 'ITR Filing Requirement',
    title: 'Bank Account for Refund',
    content: 'At least one bank account must be pre-validated and linked with PAN for receiving income tax refunds. The bank account should be active and the name should match PAN records. IFSC code must be correct. Multiple bank accounts can be added but only one is nominated for refund. Pre-validation can be done via net banking or the income tax portal.',
    source: 'Income Tax Department Guidelines',
    category: 'personal',
  },

  // ═══════════════════════════════════════════════════════════
  // FILING
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rule_itr_forms',
    topics: ['itr form', 'itr-1', 'itr-2', 'itr-3', 'itr-4', 'sahaj', 'which itr', 'form selection'],
    section: 'Section 139',
    title: 'Choosing the Right ITR Form',
    content: 'ITR-1 (Sahaj): Salary income, one house property, other sources (interest), agriculture up to ₹5,000 — total income up to ₹50 lakh. ITR-2: All of ITR-1 plus capital gains, multiple house properties, foreign income/assets — no business income. ITR-3: Business/profession income. ITR-4 (Sugam): Presumptive business income under Section 44AD/44ADA/44AE.',
    source: 'Income Tax Department Notification',
    category: 'filing',
  },
  {
    id: 'rule_filing_deadline',
    topics: ['filing deadline', 'due date', 'last date', 'july 31', 'belated return', 'revised return', 'late filing'],
    section: 'Section 139(1)',
    title: 'ITR Filing Deadlines',
    content: 'Due date for salaried individuals: July 31 of the Assessment Year. Belated return can be filed until December 31 of AY with a late fee of ₹5,000 (₹1,000 if income is below ₹5 lakh). Revised return can be filed until December 31 of AY to correct errors. Filing after the due date means you cannot carry forward certain losses and may attract interest under Section 234A.',
    source: 'Income Tax Act, 1961 — Section 139(1), 139(4), 139(5)',
    category: 'filing',
  },
  {
    id: 'rule_late_filing_penalty',
    topics: ['late filing', 'penalty', 'section 234f', 'late fee', '5000', '1000', 'interest on late filing'],
    section: 'Section 234F',
    title: 'Late Filing Fee',
    content: 'Late filing fee under Section 234F: ₹5,000 if filed after due date but before Dec 31. ₹1,000 if total income is below ₹5,00,000. Additionally, interest under Section 234A at 1% per month on unpaid tax from the due date. Loss of interest on refund for delayed filing period. Cannot carry forward losses (except house property loss) if return is belated.',
    source: 'Income Tax Act, 1961 — Section 234F',
    category: 'filing',
  },
  {
    id: 'rule_verification',
    topics: ['verification', 'e-verify', 'itr-v', 'aadhar otp', 'net banking', 'dsc', 'digital signature', '30 days'],
    section: 'Section 139(1) Proviso',
    title: 'ITR Verification',
    content: 'After filing ITR, it must be verified within 30 days. Verification methods: Aadhaar OTP, net banking, bank account EVC, Demat account EVC, or Digital Signature Certificate (DSC). If not verified in 30 days, the ITR is treated as not filed. E-verification via Aadhaar OTP is the simplest and fastest method.',
    source: 'Income Tax Department Guidelines',
    category: 'filing',
  },
  {
    id: 'rule_refund',
    topics: ['refund', 'income tax refund', 'excess tds', 'refund status', 'refund timeline', 'refund failure'],
    section: 'Section 237-245',
    title: 'Income Tax Refund',
    content: 'Refund arises when TDS/advance tax paid exceeds the actual tax liability. Refund is processed after ITR is verified and processed by CPC. Typical processing time: 20-45 days after e-verification. Refund includes interest under Section 244A at 0.5% per month from April 1 of AY. Refund is credited to the pre-validated bank account linked with PAN.',
    source: 'Income Tax Act, 1961 — Section 237-245',
    category: 'filing',
  },
  {
    id: 'rule_form_16_matching',
    topics: ['form 16 matching', 'salary matching', 'itr salary', 'salary mismatch', 'gross salary mismatch', 'form 16 vs itr'],
    section: 'ITR Best Practice',
    title: 'Form 16 and ITR Matching',
    content: 'The salary details in ITR must match Form 16 Part B exactly: gross salary, exemptions claimed, deductions under Section 16, and net taxable salary. Any mismatch will trigger a notice from CPC during processing. Common mismatches: different allowance breakup, incorrect HRA exemption, wrong professional tax amount. Always cross-verify each line item before filing.',
    source: 'Income Tax Department — CPC Processing Rules',
    category: 'filing',
  },
  {
    id: 'rule_disclosure_requirements',
    topics: ['disclosure', 'schedule fa', 'foreign assets', 'foreign income', 'foreign bank account', 'schedule fsi'],
    section: 'Section 139(1) — Seventh Proviso',
    title: 'Mandatory Disclosures',
    content: 'Residents must disclose foreign assets and income in Schedule FA (Foreign Assets) and Schedule FSI (Foreign Source Income) in ITR-2/3. Failure to disclose attracts penalty of ₹10 lakh under the Black Money Act. Also mandatory: disclosure of directorship in companies, unlisted equity investments, and cash deposits above ₹1 crore.',
    source: 'Income Tax Act, 1961 — Black Money Act, 2015',
    category: 'filing',
  },

  // ═══════════════════════════════════════════════════════════
  // COMMON MISTAKES & VALIDATIONS
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rule_common_mistake_regime',
    topics: ['common mistake', 'regime mistake', 'wrong regime', 'forgot to change regime', 'default regime'],
    section: 'Best Practice',
    title: 'Common Mistake — Wrong Tax Regime',
    content: 'The most common filing mistake is not switching tax regimes when beneficial. The New Regime is default — if you have significant deductions (80C, 80D, HRA), you should check if the Old Regime gives lower tax. Compare both by calculating tax under each. Remember: in the New Regime, you lose HRA, LTA, 80C, 80D, 80E, 80G deductions.',
    source: 'Tax Advisory — Best Practice',
    category: 'filing',
  },
  {
    id: 'rule_common_mistake_interest',
    topics: ['common mistake', 'forgot interest income', 'unreported interest', 'savings interest', 'fd interest missed'],
    section: 'Best Practice',
    title: 'Common Mistake — Unreported Interest Income',
    content: 'Many taxpayers forget to report savings bank interest and FD interest in their ITR. Even if TDS has been deducted on FD interest, it must be reported as income. Savings bank interest is reportable even if below ₹10,000 (though deduction under 80TTA applies). AIS now captures all interest credited — mismatch triggers a notice.',
    source: 'Tax Advisory — Best Practice',
    category: 'filing',
  },
  {
    id: 'rule_common_mistake_tds_mismatch',
    topics: ['tds mismatch', 'tds not matching', 'form 26as mismatch', 'tds credit', 'tds claim'],
    section: 'Best Practice',
    title: 'Common Mistake — TDS Mismatch with Form 26AS',
    content: 'TDS claimed in ITR must exactly match Form 26AS. Common issues: employer deposited less TDS than shown in Form 16, bank TDS not reflecting due to wrong PAN, claiming TDS from previous year. Always verify TDS amounts against Form 26AS before filing. If Form 16 and 26AS don\'t match, contact employer — 26AS is the source of truth.',
    source: 'Tax Advisory — Best Practice',
    category: 'filing',
  },
  {
    id: 'rule_common_mistake_deductions',
    topics: ['common mistake', 'excess deduction', 'wrong deduction', 'deduction limit exceeded', 'ineligible deduction'],
    section: 'Best Practice',
    title: 'Common Mistake — Incorrect Deductions',
    content: 'Common deduction errors: claiming more than ₹1,50,000 under 80C, claiming HRA exemption while owning the rented property, claiming 80D for premiums paid in cash (not allowed), claiming deductions under the New Regime where they are not permitted, and double-counting employer EPF contribution under 80C.',
    source: 'Tax Advisory — Best Practice',
    category: 'filing',
  },

  // ═══════════════════════════════════════════════════════════
  // ADDITIONAL RULES
  // ═══════════════════════════════════════════════════════════

  {
    id: 'rule_lta',
    topics: ['lta', 'leave travel allowance', 'leave travel concession', 'ltc', 'travel exemption'],
    section: 'Section 10(5)',
    title: 'Leave Travel Allowance (LTA)',
    content: 'LTA exemption covers actual travel expenses (domestic travel only) for the employee and family. Exemption is for the shortest route by economy class. Available only for 2 journeys in a block of 4 calendar years. Only available under the Old Tax Regime. Unused LTA block can be carried forward to the next block (one journey).',
    source: 'Income Tax Act, 1961 — Section 10(5)',
    category: 'income',
  },
  {
    id: 'rule_gratuity',
    topics: ['gratuity', 'gratuity exemption', 'retirement', 'section 10(10)', 'gratuity calculation'],
    section: 'Section 10(10)',
    title: 'Gratuity Exemption',
    content: 'Gratuity received on retirement/resignation: Government employees — fully exempt. Private employees covered under Gratuity Act — exempt up to ₹20,00,000. The exempt amount is the least of: actual gratuity, 15 days salary × years of service, or ₹20 lakh. Salary for this purpose = last drawn Basic + DA.',
    source: 'Income Tax Act, 1961 — Section 10(10)',
    category: 'income',
  },
  {
    id: 'rule_leave_encashment',
    topics: ['leave encashment', 'earned leave', 'section 10(10aa)', 'leave salary'],
    section: 'Section 10(10AA)',
    title: 'Leave Encashment Exemption',
    content: 'Leave encashment on retirement: Government employees — fully exempt. Private employees — exempt up to ₹25,00,000 (raised from ₹3 lakh). The exempt amount is the least of: actual leave encashment, 10 months average salary, cash equivalent of leave balance (max 30 days per year of service), or ₹25 lakh. Leave encashment during service is fully taxable.',
    source: 'Income Tax Act, 1961 — Section 10(10AA)',
    category: 'income',
  },
  {
    id: 'rule_employer_pf',
    topics: ['epf', 'employer pf', 'provident fund', 'employee provident fund', 'pf contribution', 'pf withdrawal'],
    section: 'Section 10(11), 10(12)',
    title: 'Provident Fund (EPF) Rules',
    content: 'Employee contribution to EPF qualifies for 80C deduction. Employer contribution up to 12% of salary is exempt. Interest on EPF is tax-free up to ₹2.5 lakh annual contribution (excess is taxable from AY 2022-23). EPF withdrawal after 5 years of continuous service is fully exempt. Withdrawal before 5 years is taxable and TDS is deducted at 10% if PAN is provided.',
    source: 'Income Tax Act, 1961 — Section 10(11), 10(12), 80C',
    category: 'income',
  },
  {
    id: 'rule_section_234a_interest',
    topics: ['234a', 'section 234a', 'interest on late filing', 'late filing interest', 'delay interest'],
    section: 'Section 234A',
    title: 'Interest for Late Filing — Section 234A',
    content: 'Interest at 1% per month (or part of month) is levied on the unpaid tax amount from the due date of filing (July 31) to the actual date of filing. Only applicable on the tax payable amount (total tax minus TDS/advance tax). If no tax is payable (refund case), no 234A interest applies even if filed late.',
    source: 'Income Tax Act, 1961 — Section 234A',
    category: 'filing',
  },
  {
    id: 'rule_itr1_eligibility',
    topics: ['itr-1', 'itr1', 'sahaj', 'itr-1 eligibility', 'who can file itr-1', 'itr-1 not applicable'],
    section: 'ITR-1 Conditions',
    title: 'ITR-1 (Sahaj) Eligibility',
    content: 'ITR-1 can be filed if: total income ≤ ₹50 lakh, income only from salary, one house property, other sources (interest/dividend), and agricultural income ≤ ₹5,000. Cannot use ITR-1 if: you have capital gains, multiple house properties, foreign income/assets, business income, are a director in a company, or have invested in unlisted equity shares.',
    source: 'Income Tax Department — ITR Form Instructions',
    category: 'filing',
  },
  {
    id: 'rule_tax_computation',
    topics: ['tax computation', 'gross total income', 'total income', 'taxable income', 'net taxable income', 'tax calculation'],
    section: 'Section 4-5',
    title: 'Tax Computation Flow',
    content: 'Tax computation: (1) Add all income heads: Salary + House Property + Capital Gains + Business + Other Sources = Gross Total Income. (2) Subtract deductions (Chapter VI-A: 80C, 80D, etc.) = Total Taxable Income. (3) Apply tax slab rates. (4) Add surcharge if applicable. (5) Add 4% Health & Education Cess. (6) Subtract TDS/advance tax = Tax Payable or Refund.',
    source: 'Income Tax Act, 1961 — Sections 4-5',
    category: 'filing',
  },
];

export default TAX_RULES;

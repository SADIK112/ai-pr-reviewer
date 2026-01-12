import type { PatternRule } from "@/types/review";

export const PATTERN_RULES: PatternRule[] = [
    // ===== SECURITY PATTERNS =====
    {
        name: 'hardcoded-api-key',
        description: 'Hardcoded API key detected. Credentials in source code can be exposed through version control, logs, or build artifacts. Store API keys in environment variables or a secrets manager.',
        pattern: /(?:api[_-]?key|apikey|api[_-]?secret|api[_-]?token)\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{20,}|sk-[a-zA-Z0-9]{20,}|pk_[a-zA-Z0-9_]{20,})['"`]/i,
        type: 'SECURITY',
        severity: 'CRITICAL',
        message: 'Hardcoded API key detected',
        suggestion: 'const apiKey = process.env.API_KEY;\nif (!apiKey) throw new Error("API_KEY not configured");',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'java', 'go']
    },
    {
        name: 'hardcoded-password',
        description: 'Hardcoded password detected. Passwords should never be committed to version control. Use environment variables, a secrets manager (AWS Secrets Manager, HashiCorp Vault), or secure configuration.',
        pattern: /(?:password|passwd|pwd|secret)\s*[:=]\s*['"`](?!.*(?:your|example|test|dummy|placeholder|xxx|changeme|\*+))([^'"`]{8,})['"`]/i,
        type: 'SECURITY',
        severity: 'CRITICAL',
        message: 'Hardcoded password detected',
        suggestion: 'const password = process.env.DB_PASSWORD;\nif (!password) throw new Error("DB_PASSWORD not configured");',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'java', 'go']
    },
    {
        name: 'hardcoded-token',
        description: 'Hardcoded access token detected. OAuth tokens, JWTs, and bearer tokens grant access to protected resources. These should be stored securely and rotated regularly.',
        pattern: /(?:token|access[_-]?token|auth[_-]?token|bearer[_-]?token)\s*[:=]\s*['"`]([a-zA-Z0-9_\-\.]{30,}|eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+)['"`]/i,
        type: 'SECURITY',
        severity: 'CRITICAL',
        message: 'Hardcoded access token detected',
        suggestion: 'const token = process.env.ACCESS_TOKEN;\nif (!token) throw new Error("ACCESS_TOKEN not configured");',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'java', 'go'],
    },
    {
        name: 'private-key',
        description: 'Private cryptographic key detected. Private keys must NEVER be committed to version control. If committed, the key is compromised and must be rotated immediately. Use a secrets manager or secure key storage.',
        pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/,
        type: 'SECURITY',
        severity: 'CRITICAL',
        message: 'Private key detected in code',
        suggestion: 'Remove the private key immediately and rotate it. Use environment variables:\nconst privateKey = process.env.PRIVATE_KEY;',
        enabled: true,
    },
    {
        name: 'sql-injection-risk',
        description: 'Potential SQL injection vulnerability detected. String concatenation or template literals in SQL queries allow attackers to inject malicious SQL. Always use parameterized queries or an ORM.',
        pattern: /(?:execute|query|raw|sql)\s*\(\s*(?:['"`].*?\$\{|.*?\+.*?['"`])/i,
        type: 'SECURITY',
        severity: 'HIGH',
        message: 'Potential SQL injection vulnerability',
        suggestion: '// Use parameterized queries\nconst result = await db.query(\n  "SELECT * FROM users WHERE id = $1",\n  [userId]\n);',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'java']
    },
    {
        name: 'command-injection',
        description: 'Potential command injection vulnerability. Executing shell commands with user input can allow attackers to run arbitrary commands. Validate and sanitize all inputs, or use safer alternatives.',
        pattern: /(?:exec|spawn|execSync|execFile)\s*\(\s*(?:['"`].*?\$\{|.*?\+)/i,
        type: 'SECURITY',
        severity: 'CRITICAL',
        message: 'Potential command injection vulnerability',
        suggestion: '// Use array syntax and validate inputs\nconst { execFile } = require("child_process");\nexecFile("command", [validatedArg1, validatedArg2]);',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx', 'py'],
    },

    // ===== DEBUG & DEVELOPMENT PATTERNS =====
    {
        name: 'console-log',
        description: 'Console.log statement found. Console statements should be removed before production deployment as they can leak sensitive information and impact performance.',
        pattern: /^\s*console\.log\s*\(/m,
        type: 'STYLE',
        severity: 'LOW',
        message: 'Console.log statement found',
        suggestion: '// Use a logging library instead\nimport logger from "./logger";\nlogger.debug("Debug message", { data });',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx']
    },
    {
        name: 'debugger-statement',
        description: 'Debugger statement found. This pauses JavaScript execution when DevTools are open. Remove before committing.',
        pattern: /^\s*debugger\s*;?\s*$/m,
        type: 'BUG',
        severity: 'MEDIUM',
        message: 'Debugger statement found',
        suggestion: 'Remove the debugger statement',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx'],
    },

    // ===== CODE QUALITY PATTERNS =====
    {
        name: 'todo-comment',
        description: 'TODO comment found. TODO comments often get forgotten. Create a ticket in your issue tracker to ensure the work gets done.',
        pattern: /(?:\/\/|#|\/\*)\s*TODO(?:\(([^)]+)\))?[:\s]/i,
        type: 'MAINTAINABILITY',
        severity: 'INFO',
        message: 'TODO comment found',
        suggestion: 'Create a ticket: // TODO: Optimize query (JIRA-123)',
        enabled: true
    },
    {
        name: 'fixme-comment',
        description: 'FIXME comment indicates a known bug or issue. These should be addressed before merging or tracked with a ticket.',
        pattern: /(?:\/\/|#|\/\*)\s*FIXME[:\s]/i,
        type: 'BUG',
        severity: 'HIGH', // Increased from MEDIUM
        message: 'FIXME comment indicates known issue',
        suggestion: 'Fix the issue or create a ticket: // FIXME: Handle null case (JIRA-456)',
        enabled: true
    },
    {
        name: 'commented-code',
        description: 'Commented-out code found. Dead code should be deleted, not commented. Version control (git) preserves history if you need to recover it.',
        pattern: /^\s*\/\/\s*(?:function|const|let|var|class|if|for|while|return|import|export)\s+/m,
        type: 'MAINTAINABILITY',
        severity: 'LOW',
        message: 'Commented-out code found',
        suggestion: 'Delete commented code. Use git history to recover if needed.',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx']
    },

    // ===== BEST PRACTICES =====
    {
        name: 'var-usage',
        description: 'Use of "var" keyword. "var" has function scope and hoisting issues. Use "const" (preferred) or "let" for block scoping.',
        pattern: /^\s*var\s+\w+/m,
        type: 'BEST_PRACTICE',
        severity: 'LOW',
        message: 'Use "const" or "let" instead of "var"',
        suggestion: '// Use const for values that don\'t change\nconst name = "John";\n// Use let for values that do change\nlet count = 0;',
        enabled: true,
        languages: ['js', 'jsx', 'ts', 'tsx']
    },
    {
        name: 'equality-operator',
        description: 'Use of loose equality (== or !=). These operators perform type coercion which can lead to unexpected behavior. Use strict equality (=== or !==).',
        pattern: /[^=!<>]==[^=]|[^=!]=!=[^=]/,
        type: 'BEST_PRACTICE',
        severity: 'MEDIUM', // Increased from LOW
        message: 'Use strict equality (=== or !==)',
        suggestion: '// Use strict equality\nif (value === null) { ... }\nif (count !== 0) { ... }',
        enabled: true,
        languages: ['js', 'jsx', 'ts', 'tsx']
    },

    // ===== TYPESCRIPT SPECIFIC =====
    {
        name: 'any-type',
        description: 'Use of "any" type defeats TypeScript\'s type safety. Use specific types, unknown (for truly dynamic types), or generics instead.',
        pattern: /:\s*any(?:\s|;|,|\)|\||&|<|>|\[|\]|$)/,
        type: 'BEST_PRACTICE',
        severity: 'MEDIUM',
        message: 'Avoid using "any" type',
        suggestion: '// Use specific types\nfunction process(data: User): void { ... }\n// Or use unknown for dynamic types\nfunction parse(data: unknown): User { ... }',
        enabled: true,
        languages: ['ts', 'tsx'],
    },
    {
        name: 'ts-ignore',
        description: '@ts-ignore or @ts-expect-error suppresses TypeScript errors. This hides real type issues. Fix the underlying type problem instead.',
        pattern: /@ts-(?:ignore|expect-error)(?:\s|$)/,
        type: 'BEST_PRACTICE',
        severity: 'MEDIUM',
        message: 'TypeScript error suppression found',
        suggestion: '// Fix the type issue instead of suppressing\nconst user = data as User; // Or better: validate the data',
        enabled: true,
        languages: ['ts', 'tsx']
    },
    {
        name: 'non-null-assertion',
        description: 'Non-null assertion operator (!) bypasses TypeScript\'s null checks. This can cause runtime errors. Use optional chaining or explicit null checks instead.',
        pattern: /\w+!\./,
        type: 'BUG',
        severity: 'MEDIUM',
        message: 'Non-null assertion bypasses null checks',
        suggestion: '// Use optional chaining\nconst email = user?.profile?.email;\n// Or explicit check\nif (user.profile) { const email = user.profile.email; }',
        enabled: true,
        languages: ['ts', 'tsx']
    },

    // ===== REACT SPECIFIC =====
    {
        name: 'react-missing-key',
        description: 'Missing "key" prop in array map. React uses keys to track which items changed, were added, or removed. Missing keys cause performance issues and bugs.',
        pattern: /\.map\s*\(\s*(?:\([^)]*\)|[\w$]+)\s*=>\s*<[A-Z]/,
        type: 'BUG',
        severity: 'HIGH',
        message: 'Missing key prop in array map',
        suggestion: '{items.map((item) => (\n  <Component key={item.id} {...item} />\n))}',
        enabled: true,
        languages: ['tsx', 'jsx'],
    },
    {
        name: 'useeffect-missing-deps',
        description: 'useEffect with empty dependency array only runs once on mount. If you\'re using values from props or state, include them in the dependency array to prevent stale closures.',
        pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\},\s*\[\s*\]\s*\)/,
        type: 'BUG',
        severity: 'MEDIUM',
        message: 'Review useEffect dependencies',
        suggestion: '// Include all values used inside the effect\nuseEffect(() => {\n  fetchData(userId);\n}, [userId]); // Add userId to deps',
        enabled: true,
        languages: ['tsx', 'jsx'],
    },

    // ===== PERFORMANCE PATTERNS =====
    {
        name: 'inefficient-array-operation',
        description: 'Array operation inside loop. Repeatedly calling push/concat creates new arrays. Consider pre-allocating or using more efficient methods.',
        pattern: /for\s*\([^)]+\)\s*\{[^}]*\.(?:push|concat)\s*\(/,
        type: 'PERFORMANCE',
        severity: 'MEDIUM',
        message: 'Array operation inside loop',
        suggestion: '// Use map/filter/reduce instead\nconst results = items.map(item => process(item));\n// Or pre-allocate\nconst results = new Array(items.length);',
        enabled: true,
        languages: ['ts', 'tsx', 'js', 'jsx'],
    },

    // ===== NULL/UNDEFINED CHECKS =====
    {
        name: 'unsafe-optional-access',
        description: 'Accessing property on potentially undefined value. This will cause "Cannot read property of undefined" errors. Use optional chaining or explicit checks.',
        pattern: /(?:const|let|var)\s+\w+\s*=\s*\w+\.\w+\.(?!then|catch)\w+/,
        type: 'BUG',
        severity: 'HIGH',
        message: 'Potentially unsafe property access',
        suggestion: '// Use optional chaining\nconst value = obj?.nested?.property;\n// Or explicit check\nif (obj && obj.nested) { const value = obj.nested.property; }',
        enabled: false, // Can be noisy, enable if desired
        languages: ['ts', 'tsx', 'js', 'jsx'],
    }
];

/**
 * Get enabled rules only
 */
export const getEnabledRules = (): PatternRule[] => {
    return PATTERN_RULES.filter(rule => rule.enabled);
};

/**
 * Get rules by severity
 */
export const getRulesBySeverity = (severity: string): PatternRule[] => {
    return PATTERN_RULES.filter(rule => rule.severity === severity);
};

/**
 * Get rules by type
 */
export const getRulesByType = (type: string): PatternRule[] => {
    return PATTERN_RULES.filter(rule => rule.type === type);
};

/**
 * Get critical rules that should always be checked
 */
export const getCriticalRules = (): PatternRule[] => {
    return PATTERN_RULES.filter(rule =>
        rule.severity === 'CRITICAL' && rule.enabled
    );
};
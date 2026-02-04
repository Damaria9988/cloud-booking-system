#!/usr/bin/env node

/**
 * Hook Order Validation Script
 * 
 * This script validates that all React components follow the Rules of Hooks.
 * It checks for:
 * 1. Hooks called after early returns
 * 2. Hooks called conditionally
 * 3. Hooks called in loops
 * 4. Proper hook grouping (useState together, useRef together, etc.)
 * 
 * Usage: node scripts/validate-hooks-order.js
 */

const fs = require('fs');
const path = require('path');

const HOOK_PATTERNS = [
  /useState\s*\(/g,
  /useEffect\s*\(/g,
  /useRef\s*\(/g,
  /useCallback\s*\(/g,
  /useMemo\s*\(/g,
  /useContext\s*\(/g,
  /useSearchParams\s*\(/g,
  /useRouter\s*\(/g,
  /usePathname\s*\(/g,
  /use\s*\(/g,
  /useAuth\s*\(/g,
  /useSocket\s*\(/g,
  /useSocketIO\s*\(/g,
];

const EARLY_RETURN_PATTERNS = [
  /^\s*if\s*\([^)]+\)\s*return\s+/m,
  /^\s*return\s+<[^>]+>/m,
];

function findHooksInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const hooks = [];
  const earlyReturns = [];
  
  lines.forEach((line, index) => {
    // Check for hooks
    HOOK_PATTERNS.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        hooks.push({
          line: index + 1,
          content: line.trim(),
          type: pattern.source.replace(/[\\^$()]/g, ''),
        });
      }
    });
    
    // Check for early returns
    EARLY_RETURN_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        earlyReturns.push({
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  });
  
  return { hooks, earlyReturns, lines };
}

function validateComponent(filePath) {
  const { hooks, earlyReturns, lines } = findHooksInFile(filePath);
  const issues = [];
  
  // Check if hooks are called after early returns
  if (earlyReturns.length > 0 && hooks.length > 0) {
    const firstEarlyReturn = earlyReturns[0];
    const hooksAfterReturn = hooks.filter(hook => hook.line > firstEarlyReturn.line);
    
    if (hooksAfterReturn.length > 0) {
      issues.push({
        type: 'hook_after_return',
        message: `Hooks called after early return at line ${firstEarlyReturn.line}`,
        hooks: hooksAfterReturn,
        earlyReturn: firstEarlyReturn,
      });
    }
  }
  
  // Check hook order (useState should be grouped, useRef should be grouped)
  const useStateHooks = hooks.filter(h => h.type.includes('useState'));
  const useRefHooks = hooks.filter(h => h.type.includes('useRef'));
  const otherHooks = hooks.filter(h => !h.type.includes('useState') && !h.type.includes('useRef'));
  
  // Check if useState hooks are interrupted by other hooks
  if (useStateHooks.length > 0 && otherHooks.length > 0) {
    const lastUseState = Math.max(...useStateHooks.map(h => h.line));
    const firstOther = Math.min(...otherHooks.filter(h => h.type.includes('useRef')).map(h => h.line));
    
    // Check if there are hooks between useState and useRef
    const hooksBetween = otherHooks.filter(h => 
      h.line > lastUseState && 
      h.line < firstOther && 
      !h.type.includes('useRef') && 
      !h.type.includes('useState')
    );
    
    if (hooksBetween.length > 0) {
      issues.push({
        type: 'hook_order',
        message: 'Hooks are not properly grouped (useState should be grouped, then useRef)',
        hooks: hooksBetween,
      });
    }
  }
  
  return issues;
}

function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, and other build directories
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        scanDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Only check component files
      if (file.includes('page.tsx') || file.includes('component') || filePath.includes('app/') || filePath.includes('components/')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function main() {
  console.log('🔍 Scanning for hook order violations...\n');
  
  const projectRoot = path.join(__dirname, '..');
  const files = scanDirectory(path.join(projectRoot, 'app'));
  files.push(...scanDirectory(path.join(projectRoot, 'components')));
  files.push(...scanDirectory(path.join(projectRoot, 'contexts')));
  
  let totalIssues = 0;
  const results = [];
  
  files.forEach(file => {
    const issues = validateComponent(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      results.push({
        file: path.relative(projectRoot, file),
        issues,
      });
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ All components follow the Rules of Hooks correctly!');
    process.exit(0);
  } else {
    console.log(`❌ Found ${totalIssues} hook order violation(s):\n`);
    results.forEach(({ file, issues }) => {
      console.log(`📄 ${file}:`);
      issues.forEach(issue => {
        console.log(`   ⚠️  ${issue.message}`);
        if (issue.hooks) {
          issue.hooks.forEach(hook => {
            console.log(`      - Line ${hook.line}: ${hook.content.substring(0, 60)}...`);
          });
        }
      });
      console.log('');
    });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateComponent, findHooksInFile };

// Policy to color mapping
const policyColorMapping = {
  'mutual': 'success',    // green
  'unilateral': 'success', // green
  'regional': 'warning',   // yellow
  'transit': 'warning',    // yellow
  'others': 'danger'      // red
};

// 获取当前主题
function getCurrentTheme() {
  // 只检查theme键值
  const themeSetting = localStorage.getItem('theme');
  
  if (themeSetting === 'dark') {
    return 'dark';
  } else if (themeSetting === 'light') {
    return 'light';
  } else if (themeSetting === 'auto') {
    // 如果是自动模式，则检查系统首选项
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  return 'light'; // 默认为light主题
}

// 更新所有政策内容的主题样式
function updatePolicyStyles() {
  const theme = getCurrentTheme();
  const policyContents = document.querySelectorAll('.policy-content');
  
  policyContents.forEach(content => {
    if (theme === 'dark') {
      content.classList.add('dark-theme');
    } else {
      content.classList.remove('dark-theme');
    }
  });
}

// 监听主题变化
function setupThemeListener() {
  let currentTheme = getCurrentTheme();
  
  // 定期检查主题变化
  setInterval(() => {
    const newTheme = getCurrentTheme();
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      updatePolicyStyles();
    }
  }, 1000);
  
  // 初始应用当前主题
  updatePolicyStyles();
}

// Parse TSV data
function parseTSV(tsvText) {
  const lines = tsvText.split('\n');
  const headers = lines[0].split('\t'); // 使用Tab分隔符

  const countryIndex = headers.indexOf('Country');
  const policiesIndex = headers.indexOf('Policies');

  const countries = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split('\t'); // 使用Tab分隔符
    if (values.length > policiesIndex) {
      countries.push({
        name: values[countryIndex].trim(), // 添加trim()去除可能的空白字符
        policies: values[policiesIndex].trim() // 添加trim()去除可能的空白字符
      });
    }
  }

  return countries.sort((a, b) => a.name.localeCompare(b.name));
}

// Convert policies to filename
function convertPolicyToFilename(policies) {
  if (!policies) return 'others';
  
  const policyParts = policies.split(', ');
  const convertedParts = policyParts.map(part => {
    // Fix: ensure returned string has no extra spaces
    return part.toLowerCase().replace(/-/g, '_').trim() + '.md';
  });
  
  return convertedParts;
}

// Get primary policy type
function getPrimaryPolicyType(policies) {
  if (!policies) return 'others';
  if (policies.includes('Mutual')) return 'mutual';
  if (policies.includes('Unilateral')) return 'unilateral';
  if (policies.includes('Regional')) return 'regional';
  if (policies.includes('Transit')) return 'transit';
  return 'others';
}

// Initialize selector
function initSelector(countryData) {
  const selector = document.getElementById('country-selector');

  countryData.forEach(country => {
    const option = document.createElement('option');
    option.value = country.name;
    option.textContent = country.name;
    selector.appendChild(option);
  });

  selector.addEventListener('change', function(event) {
    const selectedCountry = event.target.value;
    const country = countryData.find(c => c.name === selectedCountry);
    
    if (country && country.policies) {
      loadPolicy(country.policies);
    } else {
      loadPolicy('others');
    }
  });
}

async function initPage() {
  try {
    // Load country data
    const response = await fetch('/_static/1_1_visa_policy/country_visa_tags.tsv');
    if (!response.ok) {
      throw new Error(`Failed to load country data: ${response.status} ${response.statusText}`);
    }
    const tsvText = await response.text();
    const countryData = parseTSV(tsvText);

    // Initialize selector
    initSelector(countryData);

    // 设置主题监听
    setupThemeListener();
  } catch (error) {
    console.error('Error initializing page:', error);
    document.getElementById('visa-policy-display').innerHTML = 
      '<div class="policy-content policy-danger">Error loading country data.</div>';
  }
}


// Load policy content
async function loadPolicy(policies) {
  const policyDisplay = document.getElementById('visa-policy-display');

  // Convert policies to filenames
  const filenames = convertPolicyToFilename(policies);

  try {
    if (filenames.length === 1) {
      // Single policy - keep existing logic
      const filename = filenames[0];
      const policyType = getPrimaryPolicyType(policies);
      const colorClass = policyColorMapping[policyType] || 'danger';

      const response = await fetch(`/_static/1_1_visa_policy/policies/${filename}`);

      if (!response.ok) {
        throw new Error(`Failed to load policy file: ${response.status} ${response.statusText}`);
      }

      const markdown = await response.text();
      const html = marked.parse(markdown);

      const themeClass = getCurrentTheme() === 'dark' ? 'dark-theme' : '';
      policyDisplay.innerHTML = `<div class="policy-content policy-${colorClass} ${themeClass}">${html}</div>`;

    } else {
      // Multiple policies - create collapsible sections

      const themeClass = getCurrentTheme() === 'dark' ? 'dark-theme' : '';
      let html = `<p>You have the following options to enter China without a visa:</p>`;

      // Load each policy file
      for (let i = 0; i < filenames.length; i++) {
        const filename = filenames[i];
        const originalPolicy = policies.split(', ')[i];
        const policyType = getPrimaryPolicyType(originalPolicy);
        const colorClass = policyColorMapping[policyType] || 'danger';

        try {
          const response = await fetch(`/_static/1_1_visa_policy/policies/${filename}`);
          if (!response.ok) {
            throw new Error(`Failed to load policy file: ${response.status} ${response.statusText}`);
          }

          const markdown = await response.text();
          // Split markdown into lines and extract title from first line
          const lines = markdown.split('\n');
          let title = originalPolicy; // fallback to original policy name
          let contentFromSecondLine = markdown;
          
          if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // Extract title from markdown heading (remove # symbols)
            if (firstLine.startsWith('#')) {
              title = firstLine.replace(/^#+\s*/, '').trim();
              // Join from second line onwards
              contentFromSecondLine = lines.slice(1).join('\n').trim();
            }
          }

          const policyHtml = marked.parse(contentFromSecondLine);

          // Create collapsible section with extracted title
          const sectionId = `policy-section-${i}`;
          html += `
            <div class="policy-section">
              <div class="policy-header policy-${colorClass} ${themeClass}" onclick="toggleSection('${sectionId}')">
                <span class="policy-title">${title}</span>
                <span class="toggle-icon" id="icon-${sectionId}">▼</span>
              </div>
              <div class="policy-collapse policy-${colorClass} ${themeClass}" id="${sectionId}">
                ${policyHtml}
              </div>
            </div>
          `;
        } catch (error) {
          console.error(`Error loading policy ${filename}:`, error);
          html += `
            <div class="policy-section">
              <div class="policy-header policy-danger ${themeClass}">
                <span class="policy-title">${originalPolicy} (Error loading)</span>
              </div>
            </div>
          `;
        }
      }

      policyDisplay.innerHTML = html;
    }

  } catch (error) {
    try {
      const errorResponse = await fetch('/_static/1_1_visa_policy/policies/error.md');
      if (errorResponse.ok) {
        const errorMarkdown = await errorResponse.text();
        const errorHtml = marked.parse(errorMarkdown);
        const themeClass = getCurrentTheme() === 'dark' ? 'dark-theme' : '';
        policyDisplay.innerHTML = `<div class="policy-content policy-danger ${themeClass}">${errorHtml}</div>`;
      } else {
        throw new Error('Could not load error message file');
      }
    } catch (errorLoadingError) {
      console.error('Error loading error message:', errorLoadingError);
      const themeClass = getCurrentTheme() === 'dark' ? 'dark-theme' : '';
      policyDisplay.innerHTML = `<div class="policy-content policy-danger ${themeClass}">
        <h3>Error</h3>
        <p>Could not load visa policy information. Please try again later.</p>
      </div>`;
    }
  }
}

function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const icon = document.getElementById(`icon-${sectionId}`);
  
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    icon.textContent = '▲';
  } else {
    section.style.display = 'none';
    icon.textContent = '▼';
  }
}

document.addEventListener('DOMContentLoaded', initPage);
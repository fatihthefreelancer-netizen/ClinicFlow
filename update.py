import os
import re

dir_path = r"c:\Users\hp\Desktop\ClinicFlow-new-version\ClinicFlow-landing Page"

with open(os.path.join(dir_path, "index.html"), "r", encoding="utf-8") as f:
    index_html = f.read()

# Extract header CSS
header_css_match = re.search(r'    /\* --------------------------------------------------\n         HEADER – Floating SaaS NavBar\n      -------------------------------------------------- \*/.*?(?=    /\* --------------------------------------------------\n         BUTTONS)', index_html, re.DOTALL)
header_css = header_css_match.group(0).replace("    ", "", 1) # remove 1 level of indent for styles.css

# Extract footer CSS
footer_css_match = re.search(r'    /\* --------------------------------------------------\n         FOOTER – dark to match CTA, Improvement #5\n      -------------------------------------------------- \*/.*?(?=    /\* --------------------------------------------------\n         RESPONSIVE)', index_html, re.DOTALL)
footer_css = footer_css_match.group(0).replace("    ", "", 1)

# Extract Header HTML
header_html_match = re.search(r'  <!-- HEADER -->\n  <header class="header" id="navbar">.*?</header>', index_html, re.DOTALL)
header_html = header_html_match.group(0)

# Modify header HTML so links point to index.html#...
header_html = header_html.replace('href="#fonctionnalites"', 'href="index.html#fonctionnalites"')
header_html = header_html.replace('href="#comment-ca-marche"', 'href="index.html#comment-ca-marche"')
header_html = header_html.replace('href="#tarifs"', 'href="index.html#tarifs"')

# Extract Footer HTML
footer_html_match = re.search(r'  <!-- FOOTER \(dark\) – Improvement #5 bookend -->\n  <footer class="footer">.*?  </footer>', index_html, re.DOTALL)
footer_html = footer_html_match.group(0)

# Update styles.css
with open(os.path.join(dir_path, "styles.css"), "r", encoding="utf-8") as f:
    styles_css = f.read()

# Replace Header in styles.css
# The original styles.css has /* Header */
styles_css = re.sub(r'/\* Header \*/.*?\.header-right \{\s*display: flex;\s*align-items: center;\s*gap: 0.75rem;\s*\}', header_css.strip(), styles_css, flags=re.DOTALL)
# Replace Footer in styles.css
# The original styles.css has /* Footer */
styles_css = re.sub(r'/\* Footer \*/.*?\.footer-bottom \{\s*padding-top: 2rem;\s*border-top: 1px solid var\(--border\);\s*display: flex;\s*justify-content: space-between;\s*align-items: center;\s*font-size: 0.8125rem;\s*\}', footer_css.strip(), styles_css, flags=re.DOTALL)

with open(os.path.join(dir_path, "styles.css"), "w", encoding="utf-8") as f:
    f.write(styles_css)

# Update secondary pages
pages = ["conditions.html", "confidentialite.html", "cookies.html", "mentions-legales.html", "support.html"]

for page in pages:
    page_path = os.path.join(dir_path, page)
    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Replace header HTML
    content = re.sub(r'<header class="header">.*?</header>', header_html, content, flags=re.DOTALL)
    
    # Replace footer HTML
    content = re.sub(r'<footer class="footer">.*?</footer>', footer_html, content, flags=re.DOTALL)
    
    # Replace the glass navbar js snippet if it's missing (it sits right before </body>)
    nav_js = """
    <script>
    // Navbar color adaptation based on background section
    (function () {
      const navbar = document.getElementById('navbar');
      const darkSections = document.querySelectorAll('.features-section, .philosophy-section, .sales-cta, .footer');

      function checkNavbarTheme() {
        if (!navbar) return;
        const navRect = navbar.getBoundingClientRect();
        // Calculate the vertical center of the navbar
        const navCenterY = navRect.top + navRect.height / 2;
        let isDark = false;

        darkSections.forEach(function (sec) {
          const rect = sec.getBoundingClientRect();
          if (navCenterY >= rect.top && navCenterY <= rect.bottom) {
            isDark = true;
          }
        });

        if (isDark) {
          navbar.classList.add('navbar-dark');
        } else {
          navbar.classList.remove('navbar-dark');
        }
      }

      window.addEventListener('scroll', checkNavbarTheme, { passive: true });
      window.addEventListener('resize', checkNavbarTheme, { passive: true });
      // Initial check
      checkNavbarTheme();
    })();
    </script>
"""
    if "Navbar color adaptation" not in content:
        content = content.replace("</body>", f"{nav_js}</body>")
        
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updates completed successfully.")

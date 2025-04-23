# Configuration file for the Sphinx documentation builder.

# -- Project information

project = 'ChinaTripInfo'
copyright = '2025, Shangmin Guo'
author = 'Shangmin Guo'

release = '0.1'
version = '0.1.0'

# -- General configuration

extensions = [
    'sphinx.ext.duration',
    'sphinx.ext.doctest',
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.intersphinx',
    'sphinx_book_theme',
]

intersphinx_mapping = {
    'python': ('https://docs.python.org/3/', None),
    'sphinx': ('https://www.sphinx-doc.org/en/master/', None),
}
intersphinx_disabled_domains = ['std']

templates_path = ['_templates']

# Mock imports
autodoc_mock_imports = ["lumache"]

# -- Options for HTML output
html_title = 'China Trip Guidebook'
html_theme = 'sphinx_book_theme'

html_theme_options = {
    "repository_url": "https://github.com/Shawn-Guo-CN/ChinaTripInfo",
    "use_repository_button": True,
    "use_issues_button": True,
    "use_download_button": True,
    "use_fullscreen_button": True,
    "home_page_in_toc": True,
}

# -- Options for EPUB output
epub_show_urls = 'footnote'

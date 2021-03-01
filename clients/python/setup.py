import setuptools

requirements = [
    "aiohttp>=3.7.1,<3.8.0",
    "gql>=3.0",
    "python-slugify>=4.0.1",
]

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="tracker_client",
    version="1.0.0a",
    author="Thomas Nickerson",
    author_email="contact@cyber.gc.ca",
    description="A Python client for the GoC Tracker API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/canada-ca/tracker",
    license = "MIT",
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'Topic :: Software Development :: Build Tools',
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
    keywords="api graphql gql tracker canada goc client",
    packages=setuptools.find_packages(include=["tracker_client"]),
    python_requires=">=3.6",
    install_requires=requirements,
)
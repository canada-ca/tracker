import setuptools

setuptools.setup(
    name='track-digital',
    version='0.0.1',
    long_description='',
    author='GSA 18F, CDS-SNC',
    author_email='pulse@cio.gov, cds-snc@tbs-sct.gc.ca',
    url='https://github.com/cds-snc/pulse',
    include_package_data=True,
    packages=[
        'track',
    ],
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Intended Audience :: Developers',
        'Natural Language :: English',
        'Programming Language :: Python :: 3',
    ],
    install_requires=[
        'flask==0.12',
        'gunicorn==19.6.0',
        'pyyaml==3.12',
        'python-slugify==1.2.1',
        'Flask-PyMongo==0.5.1',
        'ujson==1.35',
        'flask-compress==1.4.0',
        'click==6.7',
        'gevent==1.2.2',
    ],
    extras_require={
        'development': [
            'mypy==0.590',
            'pylint==1.8.4',
            'pytest==3.5.0',
            'pytest-cov==2.5.1',
        ],
    },
)

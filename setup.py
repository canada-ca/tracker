import setuptools

setuptools.setup(
    name='tracker',
    version='0.0.1',
    long_description='',
    author='GSA 18F, CDS-SNC',
    author_email='pulse@cio.gov, cds-snc@tbs-sct.gc.ca',
    url='https://github.com/cds-snc/tracker',
    include_package_data=True,
    packages=[
        'data',
    ],
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Intended Audience :: Developers',
        'Natural Language :: English',
        'Programming Language :: Python :: 3',
    ],
    install_requires=[
        'pyyaml==5.1',
        'pymongo==3.6.1',
        'ujson==1.35',
        'click==6.7',
        'python-slugify==1.2.1',
        'azure-keyvault==1.1.0',
        'msrestazure==0.5.1'
    ],
    extras_require={
        'development': [
            'mypy==0.590',
            'pylint==1.8.4',
            'pytest==3.5.0',
            'pytest-cov==2.5.1',
        ],
    },
    entry_points='''
        [console_scripts]
        tracker=data.cli:main
    '''

)

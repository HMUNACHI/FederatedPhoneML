from setuptools import setup, find_packages

setup(
    name='cactus',
    version='0.0.0',
    author='Cactus Compute',
    description='A framework for running ML to crowdsourced mobile devices',
    long_description=open("./README.md").read(),
    long_description_content_type="text/markdown",
    url="https://cactuscompute.com",
    packages=find_packages(),
    install_requires=[
        'importlib_resources>=5.9.0',
        'tensorflow>=2.13.0,<3',
        'tf-keras>=2.16.0',
        'tensorflow-decision-forests>=1.9.0',
        'six>=1.16.0,<2',
        'tensorflow-hub>=0.16.1',
        'packaging~=23.1',
        'supabase==2.10.0',
        'realtime==2.0.0'
    ],
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Topic :: Software Development :: Build Tools",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Programming Language :: Python :: 3.9",
    ],
    python_requires='>=3.9',
)
# Chat-Your-Data

Create a ChatGPT like experience over your custom docs using [LangChain](https://github.com/hwchase17/langchain).

See [this blog post](https://blog.langchain.dev/tutorial-chatgpt-over-your-data/) for a more detailed explanation.

## Ingest data

Ingestion of data is done over the `state_of_the_union.txt` file. 
Therefor, the only thing that is needed is to be done to ingest data is run `python ingest_data.py`

## Query data
Custom prompts are used to ground the answers in the state of the union text file.

## Running the Application

By running `python app.py` from the command line you can easily interact with your ChatGPT over your own data.

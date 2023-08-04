# Chat-Your-Data

Create a ChatGPT like experience over your custom docs using [LangChain](https://github.com/langchain-ai/langchain).

See [this blog post](blogpost.md) for a more detailed explanation.

## Step 0: Install requirements

`pip install -r requirements.txt`

## Step 1: Set your open AI Key

```sh
export OPENAI_API_KEY=<your_key_here>
```


## Step 2: Ingest your data

Run: `python ingest_data.py`

This builds `vectorstore.pkl` using OpenAI Embeddings and FAISS.

## Query data

Custom prompts are used to ground the answers in the state of the union text file.

## Running the Application

By running `python app.py` from the command line you can easily interact with your ChatGPT over your own data.

# Chat-LangChain-Notion

Create a ChatGPT like experience over your Notion database using [LangChain](https://github.com/hwchase17/langchain).


## 📊 Example Data
This repo uses the [Blendle Employee Handbook](https://www.notion.so/Blendle-s-Employee-Handbook-7692ffe24f07450785f093b94bbe1a09) as an example.
It was downloaded October 18th so may have changed slightly since then!

## 🧑 Instructions for ingesting your own dataset

Export your dataset from Notion. You can do this by clicking on the three dots in the upper right hand corner and then clicking `Export`.

<img src="export_notion.png" alt="export" width="200"/>

When exporting, make sure to select the `Markdown & CSV` format option.

<img src="export_format.png" alt="export-format" width="200"/>

This will produce a `.zip` file in your Downloads folder. Move the `.zip` file into this repository.

Run the following command to unzip the zip file (replace the `Export...` with your own file name as needed).

```shell
unzip Export-d3adfe0f-3131-4bf3-8987-a52017fc1bae.zip -d Notion_DB
```

## Ingest data

Therefor, the only thing that is needed is to be done to ingest data is run `python ingest_data.py`

## Query data
Custom prompts are used to ground the answers in the Blendle Employee Handbook files.

## Running the Application

By running `python app.py` from the command line you can easily interact with your ChatGPT over your own data.

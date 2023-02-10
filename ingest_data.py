from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import UnstructuredURLLoader
from langchain.vectorstores.faiss import FAISS
from langchain.embeddings import OpenAIEmbeddings
import pickle

# Load Data
urls = [
    "https://www.understandingwar.org/backgrounder/russian-offensive-campaign-assessment-february-4-2023",
    "https://www.understandingwar.org/backgrounder/russian-offensive-campaign-assessment-february-6-2023",
    "https://www.understandingwar.org/backgrounder/russian-offensive-campaign-assessment-february-7-2023",
    "https://www.understandingwar.org/backgrounder/russian-offensive-campaign-assessment-february-8-2023",
    "https://www.understandingwar.org/backgrounder/russian-offensive-campaign-assessment-february-9-2023",
]
loader = UnstructuredURLLoader(urls=urls)
raw_documents = loader.load()

# Split text
text_splitter = RecursiveCharacterTextSplitter()
documents = text_splitter.split_documents(raw_documents)


# Load Data to vectorstore
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(documents, embeddings)


# Save vectorstore
with open("vectorstore.pkl", "wb") as f:
    pickle.dump(vectorstore, f)

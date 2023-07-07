from langchain.text_splitter import RecursiveCharacterTextSplitter, Language
# from langchain.document_loaders import UnstructuredFileLoader
from langchain.document_loaders import DirectoryLoader
from langchain.vectorstores.faiss import FAISS
from langchain.embeddings import OpenAIEmbeddings
import pickle

# Load Data
# loader = UnstructuredFileLoader("state_of_the_union.txt")
loader = DirectoryLoader('./importFiles')
raw_documents = loader.load()

# Split text
text_splitter = RecursiveCharacterTextSplitter.from_language(language=Language.JS)
documents = text_splitter.split_documents(raw_documents)


# Load Data to vectorstore
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(documents, embeddings)


# Save vectorstore
with open("vectorstore.pkl", "wb") as f:
    pickle.dump(vectorstore, f)

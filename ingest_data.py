from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import UnstructuredFileLoader
from langchain.vectorstores.faiss import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains.hyde.base import HypotheticalDocumentEmbedder
from langchain.llms import OpenAI
import pickle
from glob import glob
import os
from langchain.docstore.document import Document

from config import settings

def read_text(path):
    try:
        with open(path) as f:
            text = f.read()
            metadata = {"source": path}
            return Document(page_content=text, metadata=metadata)
    except:
        return None
# Load and split Document
text_path_candidates = glob("data/*/*")
documents = [
    read_text(text_path_candidate)
    for text_path_candidate in text_path_candidates
    if read_text(text_path_candidate)
]


# Load Data to vectorstore
embeddings = HypotheticalDocumentEmbedder.from_llm(
llm=OpenAI(n=settings.HyDE_n, best_of=settings.HyDE_best_of),
base_embeddings=OpenAIEmbeddings(),
prompt_key="web_search",
)

vectorstore = FAISS.from_documents(documents, embeddings)


# Save vectorstore
with open("vectorstore.pkl", "wb") as f:
    pickle.dump(vectorstore, f)

import pickle

from langchain.chains.question_answering import load_qa_chain
from langchain.llms import OpenAI


class SearchFromDocs:
    def __init__(self):
        with open("/Users/yongtae/Documents/personal/code/langchainChallenge/vectorstore.pkl", "rb") as f:
            self.docsearch = pickle.load(f)
        self.chain = load_qa_chain(OpenAI(), chain_type="stuff")

    def __call__(self, question: str) -> str:
        docs = self.docsearch.similarity_search(question, k=3)
        res = self.chain(
            {
                "input_documents": docs,
                "question": question + ". Please answer in longer sentences.",
            },
            return_only_outputs=True,
        )

        return res["output_text"]

    def run(self, question: str) -> str:
        return self(question)

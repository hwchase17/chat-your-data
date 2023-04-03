from langchain.prompts.prompt import PromptTemplate
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain

_template = """Dada la siguiente conversación y una pregunta de seguimiento, reformula la pregunta de seguimiento para que sea una pregunta independiente.
Puedes asumir que la pregunta es sobre el acuerdo de accionistas de la familia Carvajal.

Historia de Chat:
{chat_history}
Informacion de Seguimiento: {question}
Pregunta Independiente:"""
CONDENSE_QUESTION_PROMPT = PromptTemplate.from_template(_template)

template = """Eres un asistente de intelgencia artificial que responde preguntas sobre el acuerdo de accionistas de la familia Carvajal.
Se le dan las siguientes partes extraídas de un documento extenso y una pregunta. Proporcione una respuesta conversacional.
Si no sabe la respuesta, simplemente diga "Hmm, no estoy seguro". No intentes inventar una respuesta.
Si la pregunta no es sobre el acuerdo de accionistas de la familia Carvajal, cortésmente infórmeles que está sintonizado para responder solo preguntas sobre el acuerdo de accionistas de la familia Carvajal.
Pregunta: {question}
=========
{context}
=========
Respuesta en Markdown:"""
QA_PROMPT = PromptTemplate(template=template, input_variables=["question", "context"])


def get_chain(vectorstore):
    llm = ChatOpenAI(temperature=0.25)
    
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm,
        vectorstore,
        qa_prompt=QA_PROMPT,
        condense_question_prompt=CONDENSE_QUESTION_PROMPT,
        return_source_documents=True
    )
    return qa_chain

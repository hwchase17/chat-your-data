import os
from typing import Optional, Tuple
from threading import Lock

import gradio as gr

from query_data import get_basic_qa_chain


def set_openai_api_key(api_key: str):
    """Set the api key and return chain.
    If no api_key, then None is returned.
    """
    if api_key:
        os.environ["OPENAI_API_KEY"] = api_key
        chain = get_basic_qa_chain()
        os.environ["OPENAI_API_KEY"] = ""
        return chain


class ChatWrapper:

    def __init__(self):
        self.lock = Lock()

    def __call__(
        self, api_key: str, inp: str, history: Optional[Tuple[str, str]], chain
    ):
        """Execute the chat functionality."""
        self.lock.acquire()
        try:
            history = history or []
            # If chain is None, that is because no API key was provided.
            if chain is None:
                history.append((inp, "Please paste your OpenAI key to use"))
                return history, history
            # Set OpenAI key
            import openai
            openai.api_key = api_key
            # Run chain and append input.
            output = chain({"question": inp})["answer"]
            history.append((inp, output))
        except Exception as e:
            raise e
        finally:
            self.lock.release()
        return history, history


chat = ChatWrapper()

block = gr.Blocks(css=".gradio-container {background-color: lightgray}")

with block:
    with gr.Row():
        gr.Markdown(
            "<h3><center>Chat-Your-Data (State-of-the-Union)</center></h3>")

        openai_api_key_textbox = gr.Textbox(
            placeholder="Paste your OpenAI API key (sk-...)",
            show_label=False,
            lines=1,
            type="password",
        )

    chatbot = gr.Chatbot()

    with gr.Row():
        message = gr.Textbox(
            label="What's your question?",
            placeholder="Ask questions about the most recent state of the union",
            lines=1,
        )
        submit = gr.Button(value="Send", variant="secondary").style(
            full_width=False)

    gr.Examples(
        examples=[
            "What did the president say about Ketanji Brown Jackson?",
            "Did he mention Stephen Breyer?",
            "What was his stance on Ukraine?",
        ],
        inputs=message,
    )

    gr.HTML("Demo application of a LangChain chain.")

    gr.HTML(
        "<center>Powered by <a href='https://github.com/hwchase17/langchain'>LangChain 🦜️🔗</a></center>"
    )

    state = gr.State()
    agent_state = gr.State()

    submit.click(chat, inputs=[openai_api_key_textbox, message,
                 state, agent_state], outputs=[chatbot, state])
    message.submit(chat, inputs=[
                   openai_api_key_textbox, message, state, agent_state], outputs=[chatbot, state])

    openai_api_key_textbox.change(
        set_openai_api_key,
        inputs=[openai_api_key_textbox],
        outputs=[agent_state],
    )

block.launch(debug=True)

from query_data import chain_options
from rich.console import Console
from rich.prompt import Prompt

if __name__ == "__main__":
    c = Console()
    model = Prompt.ask("Which QA model would you like to work with?",
                       choices=list(chain_options.keys()),
                       default="basic")
    chain = chain_options[model]()

    c.print("[bold]Chat with your docs!")
    c.print("[bold red]---------------")

    while True:
        default_question = "what did the president say about ketanji brown?"
        question = Prompt.ask("Your Question: ", default=default_question)
        # change this line if you're using RetrievalQA
        # input = query
        # output = result
        result = chain({"question": question})
        c.print("[green]Answer: [/green]" + result['answer'])

        # include a bit more if we're using `with_sources`
        if model == "with_sources" and result.get('source_documents', None):
            c.print("[green]Sources: [/green]")
            for doc in result['source_documents']:
                c.print(f"[bold underline green]{doc.metadata['source']}")
                c.print("[green]" + doc.page_content)
        c.print("[bold red]---------------")

import os
from typing import TypedDict

# Creating State for the Good Script Project

class pipeline_state(TypedDict):
    raw_input:str
    editor_text:str
    script_text:str
    final_output:str
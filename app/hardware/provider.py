import os, time

class HardwareProvider:
    def __init__(self):
        self.mode = os.getenv("HW_MODE", "mock")  # "mock" | "gpio" | "mcp23017" | "modbus" etc.

    def set_on(self, address: str):
        # TODO: implement per mode
        print(f"[{self.mode}] ON {address}")

    def set_off(self, address: str):
        print(f"[{self.mode}] OFF {address}")

    def pulse(self, address: str, ms: int):
        print(f"[{self.mode}] PULSE {address} {ms}ms")
        time.sleep(ms / 1000)
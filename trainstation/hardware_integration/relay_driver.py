from device_communication.usb_relay_backend import USBRelayBackend

class RelayDriver:
    """High-level relay controller using USBRelayBackend."""
    def __init__(self, relay_backend=None, channel_count=8, safety_delay=0.1):
        self.backend = relay_backend or USBRelayBackend()
        self.channel_count = channel_count
        self.safety_delay = safety_delay

    def set_relay(self, channel, state):
        """
        Set relay channel ON/OFF (state=True/False).
        TODO: Implement debounce, retry, and safety delay logic.
        """
        if not (0 <= channel < self.channel_count):
            raise ValueError(f"Invalid relay channel: {channel}")
        self.backend.set_channel(channel, state)
        # Placeholder for debounce/safety delay
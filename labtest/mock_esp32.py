#!/usr/bin/env python3
"""
Mock ESP32 Node Server
Simulates an ESP32 node that can receive commands via HTTP and control relay pins.
This script can be used to test the full stack without real hardware.
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any
from urllib.parse import parse_qs

from aiohttp import web, web_request
import aiohttp_cors

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('mock-esp32')

class MockESP32Node:
    def __init__(self, node_id: str, port: int = 8080):
        self.node_id = node_id
        self.port = port
        self.pin_states: Dict[int, Dict[str, Any]] = {}
        self.command_history = []
        
    def set_pin_state(self, pin: int, state: str, duration_ms: int = None):
        """Simulate setting a pin state"""
        timestamp = datetime.now().isoformat()
        
        # Update pin state
        self.pin_states[pin] = {
            'state': state,
            'timestamp': timestamp,
            'duration_ms': duration_ms
        }
        
        # Log the action
        logger.info(f"Pin {pin} set to {state}" + (f" for {duration_ms}ms" if duration_ms else ""))
        
        # Add to command history
        self.command_history.append({
            'timestamp': timestamp,
            'pin': pin,
            'state': state,
            'duration_ms': duration_ms
        })
        
        # Keep only last 100 commands
        if len(self.command_history) > 100:
            self.command_history.pop(0)
    
    async def handle_pin_control(self, request: web_request.Request):
        """Handle pin control requests"""
        try:
            data = await request.json()
            
            pin = data.get('pin')
            action = data.get('action', 'on')
            duration_ms = data.get('duration_ms')
            
            if pin is None:
                return web.json_response(
                    {'error': 'Pin number required'}, 
                    status=400
                )
            
            pin = int(pin)
            
            # Simulate the action
            if action == 'on':
                self.set_pin_state(pin, 'on')
            elif action == 'off':
                self.set_pin_state(pin, 'off')
            elif action == 'toggle':
                # For toggle, simulate a brief pulse
                duration = duration_ms or 250
                self.set_pin_state(pin, 'toggle', duration)
                # Schedule turning off after duration
                asyncio.create_task(self._delayed_off(pin, duration))
            elif action == 'timed':
                # Turn on, then schedule off
                duration = duration_ms or 5000
                self.set_pin_state(pin, 'on', duration)
                asyncio.create_task(self._delayed_off(pin, duration))
            else:
                return web.json_response(
                    {'error': f'Unknown action: {action}'}, 
                    status=400
                )
            
            response = {
                'status': 'success',
                'node_id': self.node_id,
                'pin': pin,
                'action': action,
                'timestamp': datetime.now().isoformat()
            }
            
            if duration_ms:
                response['duration_ms'] = duration_ms
            
            return web.json_response(response)
            
        except Exception as e:
            logger.error(f"Error handling pin control: {e}")
            return web.json_response(
                {'error': str(e)}, 
                status=500
            )
    
    async def _delayed_off(self, pin: int, delay_ms: int):
        """Turn off a pin after a delay"""
        await asyncio.sleep(delay_ms / 1000.0)
        self.set_pin_state(pin, 'off')
    
    async def handle_status(self, request: web_request.Request):
        """Return node status and pin states"""
        return web.json_response({
            'node_id': self.node_id,
            'status': 'online',
            'timestamp': datetime.now().isoformat(),
            'pin_states': self.pin_states,
            'uptime_seconds': time.time() - self.start_time
        })
    
    async def handle_history(self, request: web_request.Request):
        """Return command history"""
        limit = int(request.query.get('limit', 50))
        return web.json_response({
            'node_id': self.node_id,
            'history': self.command_history[-limit:],
            'total_commands': len(self.command_history)
        })
    
    async def handle_reset(self, request: web_request.Request):
        """Reset all pin states"""
        self.pin_states.clear()
        logger.info("All pin states reset")
        return web.json_response({
            'status': 'success',
            'message': 'All pin states reset',
            'timestamp': datetime.now().isoformat()
        })
    
    async def create_app(self):
        """Create the web application"""
        app = web.Application()
        
        # Add CORS support
        cors = aiohttp_cors.setup(app, defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods="*"
            )
        })
        
        # Add routes
        app.router.add_post('/control', self.handle_pin_control)
        app.router.add_get('/status', self.handle_status)
        app.router.add_get('/history', self.handle_history)
        app.router.add_post('/reset', self.handle_reset)
        
        # Add CORS to all routes
        for route in list(app.router.routes()):
            cors.add(route)
        
        return app
    
    async def start(self):
        """Start the mock ESP32 server"""
        self.start_time = time.time()
        app = await self.create_app()
        
        runner = web.AppRunner(app)
        await runner.setup()
        
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        
        logger.info(f"Mock ESP32 node '{self.node_id}' started on port {self.port}")
        logger.info(f"Available endpoints:")
        logger.info(f"  POST http://localhost:{self.port}/control - Control pins")
        logger.info(f"  GET  http://localhost:{self.port}/status - Get status")
        logger.info(f"  GET  http://localhost:{self.port}/history - Get command history")
        logger.info(f"  POST http://localhost:{self.port}/reset - Reset all pins")
        
        return runner

async def main():
    """Main function to run multiple mock ESP32 nodes"""
    nodes = [
        MockESP32Node('esp32-01', 8081),
        MockESP32Node('esp32-02', 8082),
        MockESP32Node('esp32-03', 8083),
        MockESP32Node('esp32-04', 8084),
        MockESP32Node('esp32-05', 8085),
    ]
    
    # Start all nodes
    runners = []
    for node in nodes:
        runner = await node.start()
        runners.append(runner)
    
    logger.info(f"Started {len(nodes)} mock ESP32 nodes")
    logger.info("Press Ctrl+C to stop all nodes")
    
    try:
        # Keep the server running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down mock ESP32 nodes...")
        for runner in runners:
            await runner.cleanup()

if __name__ == '__main__':
    # Install required packages with: pip install aiohttp aiohttp-cors
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown complete.")
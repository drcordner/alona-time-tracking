#!/usr/bin/env python3
"""
Simple HTTP server for testing the Time Tracker app.
Run this script and open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for module imports
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 Time Tracker server running at http://localhost:{PORT}")
        print("📱 Open this URL in your browser to test the app")
        print("🔄 Press Ctrl+C to stop the server")
        
        # Automatically open browser
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")

if __name__ == "__main__":
    start_server() 
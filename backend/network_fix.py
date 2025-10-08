# backend/network_fix.py
import socket

# Get the original getaddrinfo function
original_getaddrinfo = socket.getaddrinfo

def patched_getaddrinfo(*args, **kwargs):
    """
    Forces getaddrinfo to return only IPv4 addresses.
    This can resolve stubborn network errors on some systems.
    """
    # Request only IPv4 results
    args = list(args)
    args[2] = socket.AF_INET
    return original_getaddrinfo(*args, **kwargs)

# Monkey-patch the socket library
socket.getaddrinfo = patched_getaddrinfo
print("--- Network fix applied: Forcing IPv4 ---")
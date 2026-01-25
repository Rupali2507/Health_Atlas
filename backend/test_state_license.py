from production_tools import verify_state_license_universal

if __name__ == "__main__":
    result = verify_state_license_universal(
        state_code="GA",
        license_number="A123456",
        provider_name="John Doe"
    )

    print("\n📄 FINAL RESULT:")
    print(result)

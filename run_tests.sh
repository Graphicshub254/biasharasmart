#!/bin/bash
API_URL="http://localhost:3000/api/onboard"

echo "Test 1: KRA PIN validation (A123456789B)"
time curl -s -X POST "$API_URL/validate-pin" -H "Content-Type: application/json" -d '{"kraPin":"A123456789B"}'
echo -e "\n"

echo "Test 2: Invalid PIN validation (BADPIN)"
time curl -s -X POST "$API_URL/validate-pin" -H "Content-Type: application/json" -d '{"kraPin":"BADPIN"}'
echo -e "\n"

echo "Test 3: Paybill validation (174379)"
time curl -s -X POST "$API_URL/validate-mpesa" -H "Content-Type: application/json" -d '{"paybill":"174379","type":"paybill"}'
echo -e "\n"

echo "Test 4: Complete onboarding"
curl -s -X POST "$API_URL/complete" -H "Content-Type: application/json" -d '{"businessType":"sole_proprietor","kraPin":"A123456789B","paybill":"174379","paybillType":"paybill","kycDocumentUrl":"https://example.com/doc.pdf"}' | python3 -m json.tool
echo -e "\n"

BID="7951dda8-a30e-4928-8350-b6c5662154a8"
echo "--- 1. Create Invoice ---"
curl -s -X POST http://localhost:3000/api/invoices -H "Content-Type: application/json" -d "{\"businessId\":\"$BID\",\"customerName\":\"Integration Test\",\"lineItems\":[{\"description\":\"Service Fee\",\"quantity\":2,\"unitPrice\":5000,\"vatRate\":0.16}]}" > /tmp/inv.json
cat /tmp/inv.json | python3 -m json.tool | grep -E "id|status|cuNumber|totalKes"

echo "--- 2. Get Invoice ID ---"
IID=$(cat /tmp/inv.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])")
echo "IID: $IID"

echo "--- 3. Get Detail ---"
curl -s http://localhost:3000/api/invoices/$IID | python3 -m json.tool | grep -E "id|status|totalKes"

echo "--- 4. Mark as paid ---"
curl -s -X PATCH http://localhost:3000/api/invoices/$IID/status -H "Content-Type: application/json" -d "{\"status\":\"paid\"}" | python3 -m json.tool | grep status

echo "--- 5. Verify list ---"
curl -s "http://localhost:3000/api/invoices?businessId=$BID" | python3 -m json.tool | grep total

# WooCommerce Orders Viewer Script
# Fetches and displays all order details for a given email

# Configuration (same credentials as test script)
$BASE_URL = "https://appanel.alternatehealthclub.com"
$API_KEY = "ahc_live_sk_073a330cb380bd4a69ef59c5e54b94558e6de79dfdc41ba3fabe62adc30356a1"
$TEST_EMAIL = "akshay@devgraphix.com"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "WooCommerce Orders Viewer" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fetching orders for: $TEST_EMAIL" -ForegroundColor Yellow
Write-Host ""

# Function to format and display order details
function Display-OrderDetails {
    param(
        [object]$Orders
    )
    
    if (-not $Orders -or $Orders.Count -eq 0) {
        Write-Host "No orders found." -ForegroundColor Yellow
        return
    }
    
    Write-Host "Found $($Orders.Count) order(s)" -ForegroundColor Green
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $orderIndex = 1
    foreach ($order in $Orders) {
        Write-Host "Order #$orderIndex" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        
        # Basic Order Information
        if ($order.id) { Write-Host "  Order ID: $($order.id)" -ForegroundColor White }
        if ($order.number) { Write-Host "  Order Number: $($order.number)" -ForegroundColor White }
        if ($order.status) { Write-Host "  Status: $($order.status)" -ForegroundColor $(if ($order.status -eq "completed") { "Green" } elseif ($order.status -eq "processing") { "Yellow" } else { "White" }) }
        if ($order.date_created) { Write-Host "  Date Created: $($order.date_created)" -ForegroundColor White }
        if ($order.date_modified) { Write-Host "  Date Modified: $($order.date_modified)" -ForegroundColor White }
        
        # Customer Information
        if ($order.billing) {
            Write-Host ""
            Write-Host "  Billing Information:" -ForegroundColor Cyan
            if ($order.billing.first_name -or $order.billing.last_name) {
                Write-Host "    Name: $($order.billing.first_name) $($order.billing.last_name)" -ForegroundColor White
            }
            if ($order.billing.email) { Write-Host "    Email: $($order.billing.email)" -ForegroundColor White }
            if ($order.billing.phone) { Write-Host "    Phone: $($order.billing.phone)" -ForegroundColor White }
            if ($order.billing.company) { Write-Host "    Company: $($order.billing.company)" -ForegroundColor White }
            if ($order.billing.address_1) {
                $address = $order.billing.address_1
                if ($order.billing.address_2) { $address += ", $($order.billing.address_2)" }
                Write-Host "    Address: $address" -ForegroundColor White
            }
            if ($order.billing.city -or $order.billing.state -or $order.billing.postcode) {
                $location = ""
                if ($order.billing.city) { $location += $order.billing.city }
                if ($order.billing.state) { $location += ", $($order.billing.state)" }
                if ($order.billing.postcode) { $location += " $($order.billing.postcode)" }
                if ($order.billing.country) { $location += ", $($order.billing.country)" }
                Write-Host "    Location: $location" -ForegroundColor White
            }
        }
        
        # Shipping Information
        if ($order.shipping) {
            Write-Host ""
            Write-Host "  Shipping Information:" -ForegroundColor Cyan
            if ($order.shipping.first_name -or $order.shipping.last_name) {
                Write-Host "    Name: $($order.shipping.first_name) $($order.shipping.last_name)" -ForegroundColor White
            }
            if ($order.shipping.address_1) {
                $address = $order.shipping.address_1
                if ($order.shipping.address_2) { $address += ", $($order.shipping.address_2)" }
                Write-Host "    Address: $address" -ForegroundColor White
            }
            if ($order.shipping.city -or $order.shipping.state -or $order.shipping.postcode) {
                $location = ""
                if ($order.shipping.city) { $location += $order.shipping.city }
                if ($order.shipping.state) { $location += ", $($order.shipping.state)" }
                if ($order.shipping.postcode) { $location += " $($order.shipping.postcode)" }
                if ($order.shipping.country) { $location += ", $($order.shipping.country)" }
                Write-Host "    Location: $location" -ForegroundColor White
            }
        }
        
        # Order Items
        if ($order.line_items -and $order.line_items.Count -gt 0) {
            Write-Host ""
            Write-Host "  Order Items ($($order.line_items.Count)):" -ForegroundColor Cyan
            $itemIndex = 1
            foreach ($item in $order.line_items) {
                Write-Host "    [$itemIndex] $($item.name)" -ForegroundColor White
                if ($item.sku) { Write-Host "        SKU: $($item.sku)" -ForegroundColor Gray }
                if ($item.quantity) { Write-Host "        Quantity: $($item.quantity)" -ForegroundColor Gray }
                if ($item.price) { Write-Host "        Price: $($item.price)" -ForegroundColor Gray }
                if ($item.total) { Write-Host "        Total: $($item.total)" -ForegroundColor Gray }
                $itemIndex++
            }
        }
        
        # Payment Information
        Write-Host ""
        Write-Host "  Payment Information:" -ForegroundColor Cyan
        if ($order.payment_method) { Write-Host "    Payment Method: $($order.payment_method)" -ForegroundColor White }
        if ($order.payment_method_title) { Write-Host "    Payment Method Title: $($order.payment_method_title)" -ForegroundColor White }
        if ($order.transaction_id) { Write-Host "    Transaction ID: $($order.transaction_id)" -ForegroundColor White }
        
        # Totals
        Write-Host ""
        Write-Host "  Totals:" -ForegroundColor Cyan
        if ($order.total) { Write-Host "    Total: $($order.total)" -ForegroundColor Green -NoNewline; if ($order.currency) { Write-Host " $($order.currency)" -ForegroundColor Green } else { Write-Host "" } }
        if ($order.total_tax) { Write-Host "    Tax: $($order.total_tax)" -ForegroundColor White }
        if ($order.shipping_total) { Write-Host "    Shipping: $($order.shipping_total)" -ForegroundColor White }
        if ($order.discount_total) { Write-Host "    Discount: $($order.discount_total)" -ForegroundColor White }
        
        # Additional Information
        if ($order.customer_note) {
            Write-Host ""
            Write-Host "  Customer Note:" -ForegroundColor Cyan
            Write-Host "    $($order.customer_note)" -ForegroundColor White
        }
        
        if ($order.meta_data -and $order.meta_data.Count -gt 0) {
            Write-Host ""
            Write-Host "  Additional Metadata:" -ForegroundColor Cyan
            foreach ($meta in $order.meta_data) {
                if ($meta.key -and $meta.value) {
                    Write-Host "    $($meta.key): $($meta.value)" -ForegroundColor Gray
                }
            }
        }
        
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        
        $orderIndex++
    }
}

# Main execution
$startTime = Get-Date
$httpStatus = $null
$response = $null

try {
    $headers = @{
        "X-API-Key" = $API_KEY
        "Content-Type" = "application/json"
    }
    
    $uri = "$BASE_URL/api/woocommerce/orders?email=$TEST_EMAIL"
    Write-Host "Requesting: GET $uri" -ForegroundColor Gray
    Write-Host ""
    
    $response = Invoke-RestMethod -Uri $uri `
        -Method "GET" `
        -Headers $headers
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "HTTP Status: 200 OK" -ForegroundColor Green
    Write-Host "Response Time: $([math]::Round($duration, 3))s" -ForegroundColor Cyan
    Write-Host ""
    
    # Display orders
    if ($response.orders) {
        Display-OrderDetails -Orders $response.orders
    } elseif ($response -is [array]) {
        Display-OrderDetails -Orders $response
    } else {
        Write-Host "Unexpected response format:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 10
    }
    
    # Optionally save full JSON to file
    $jsonOutput = $response | ConvertTo-Json -Depth 10
    $outputFile = "orders_$($TEST_EMAIL -replace '@', '_at_')_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    $jsonOutput | Out-File -FilePath $outputFile -Encoding UTF8
    Write-Host "Full order details saved to: $outputFile" -ForegroundColor Green
    
} catch {
    $httpStatus = if ($_.Exception.Response) { 
        $_.Exception.Response.StatusCode.value__ 
    } else { 
        "Error" 
    }
    
    Write-Host "Error occurred!" -ForegroundColor Red
    Write-Host "HTTP Status: $httpStatus" -ForegroundColor Red
    Write-Host "Error Message: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

Write-Host ""
Write-Host "Script completed!" -ForegroundColor Green
Write-Host ""


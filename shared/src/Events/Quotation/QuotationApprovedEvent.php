<?php

namespace IntelliTrack\Shared\Events\Quotation;

use IntelliTrack\Shared\Events\DomainEvent;

class QuotationApprovedEvent extends DomainEvent
{
    public static function create(int $quotationId, string $quotationNumber, int $customerId, int $approvedBy, float $totalAmount): self
    {
        return new self([
            'quotation_id' => $quotationId,
            'quotation_number' => $quotationNumber,
            'customer_id' => $customerId,
            'approved_by' => $approvedBy,
            'total_amount' => $totalAmount,
        ]);
    }
}

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CustomerInfo } from '../models/marketplace.model';
import { MarketplaceService } from './marketplace.service';

describe('MarketplaceService (D4 payment removal)', () => {
  let service: MarketplaceService;
  let httpMock: HttpTestingController;

  const customer: CustomerInfo = {
    fullName: 'Alice',
    addressLine1: '1 Main St',
    city: 'Dhaka',
    state: 'Dhaka',
    postalCode: '1000',
    country: 'BD',
    email: 'alice@example.com',
    phone: '+8801000000000'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MarketplaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('checkout sends the backend zipCode field and no card/transaction data', () => {
    service.checkout(customer).subscribe();

    const request = httpMock.expectOne('/api/market/orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.shippingAddress.zipCode).toBe('1000');
    expect(request.request.body.paymentInfo).toEqual({ paymentMethod: 'CASH_ON_DELIVERY' });
    expect(JSON.stringify(request.request.body)).not.toContain('transactionId');
    request.flush({ success: true, data: {} });
  });

  it('confirms cash payment through the seller/admin endpoint, never /pay', () => {
    service.confirmCashOrder('ord1').subscribe();

    const request = httpMock.expectOne('/api/market/orders/ord1/confirm-cash');
    expect(request.request.method).toBe('POST');
    request.flush({ success: true, data: {} });

    httpMock.expectNone('/api/market/orders/ord1/pay');
  });

  it('exposes no buyer self-pay or duplicate paid-marking method', () => {
    const api = service as unknown as Record<string, unknown>;
    expect(api['payOrder']).toBeUndefined();
    expect(api['markOrderPaid']).toBeUndefined();
  });
});

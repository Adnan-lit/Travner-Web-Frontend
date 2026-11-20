import { of } from 'rxjs';
import { OrderManagementComponent } from './order-management.component';
import { MarketplaceService } from '../../../services/marketplace.service';
import { AuthService } from '../../../services/auth.service';
import { Order } from '../../../models/marketplace.model';

describe('OrderManagementComponent (P2-05 order lifecycle)', () => {
  let confirmCashOrder: jasmine.Spy;
  let fulfillOrder: jasmine.Spy;
  let adminCancelOrder: jasmine.Spy;
  let component: OrderManagementComponent;

  beforeEach(() => {
    confirmCashOrder = jasmine.createSpy('confirmCashOrder').and.returnValue(of({ success: true }));
    fulfillOrder = jasmine.createSpy('fulfillOrder').and.returnValue(of({ success: true }));
    adminCancelOrder = jasmine.createSpy('adminCancelOrder').and.returnValue(of({ success: true }));

    const marketplace = { confirmCashOrder, fulfillOrder, adminCancelOrder } as unknown as MarketplaceService;
    const auth = {} as AuthService;
    component = new OrderManagementComponent(marketplace, auth);
    spyOn(component, 'loadOrders');
    spyOn(component, 'loadOrderStats');
  });

  function orderWith(status: Order['status']): Order {
    return { id: 'ord1', status } as Order;
  }

  it('offers only transitions supported by the backend state machine', () => {
    expect(component.getStatusOptions('PENDING')).toEqual(['PAID', 'CANCELLED']);
    expect(component.getStatusOptions('CONFIRMED')).toEqual(['PAID', 'CANCELLED']);
    expect(component.getStatusOptions('PAID')).toEqual(['FULFILLED', 'CANCELLED']);
    expect(component.getStatusOptions('FULFILLED')).toEqual([]);
    expect(component.getStatusOptions('CANCELLED')).toEqual([]);
  });

  it('routes PAID updates to cash confirmation and never to self-pay', () => {
    component.selectedOrder = orderWith('PENDING');
    component.newStatus = 'PAID';

    component.confirmStatusUpdate();

    expect(confirmCashOrder).toHaveBeenCalledWith('ord1');
    expect(fulfillOrder).not.toHaveBeenCalled();
  });

  it('routes FULFILLED and CANCELLED updates to their authorized endpoints', () => {
    component.selectedOrder = orderWith('PAID');
    component.newStatus = 'FULFILLED';
    component.confirmStatusUpdate();

    component.selectedOrder = orderWith('PENDING');
    component.newStatus = 'CANCELLED';
    component.confirmStatusUpdate();

    expect(fulfillOrder).toHaveBeenCalledWith('ord1');
    expect(adminCancelOrder).toHaveBeenCalledWith('ord1');
    expect(confirmCashOrder).not.toHaveBeenCalled();
  });

  it('reads the backend paymentStatus field when filtering', () => {
    component.orders = [
      orderWith('PAID'),
      orderWith('PENDING')
    ];
    component.orders[0].paymentInfo = { paymentStatus: 'COMPLETED' };
    component.orders[1].paymentInfo = { paymentStatus: 'PENDING' };
    component.filters.paymentStatus = 'COMPLETED';

    component.applyFilters();

    expect(component.orders.length).toBe(1);
    expect(component.orders[0].status).toBe('PAID');
  });
});

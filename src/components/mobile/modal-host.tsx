"use client";

import { useAppStore } from "@/store/use-app-store";
import { SaleModal } from "@/components/modals/sale-modal";
import { PurchaseModal } from "@/components/modals/purchase-modal";
import { ExpenseModal } from "@/components/modals/expense-modal";
import { PaymentModal } from "@/components/modals/payment-modal";
import { ProductModal } from "@/components/modals/product-modal";
import { CustomerModal } from "@/components/modals/customer-modal";
import { SupplierModal } from "@/components/modals/supplier-modal";
import { StockAdjustmentModal } from "@/components/modals/stock-adjustment-modal";
import { StockHistoryModal } from "@/components/modals/stock-history-modal";
import { InvoiceModal } from "@/components/modals/invoice-modal";
import { CustomerDetailsModal } from "@/components/modals/customer-details-modal";
import { SupplierDetailsModal } from "@/components/modals/supplier-details-modal";
import { NotificationsModal } from "@/components/modals/notifications-modal";
import { BackupModal } from "@/components/modals/backup-modal";
import { ShopSetupModal } from "@/components/modals/shop-setup-modal";
import { ChangePasswordModal } from "@/components/modals/change-password-modal";
import { ChangeCredentialsModal } from "@/components/modals/change-credentials-modal";
import { MembersModal } from "@/components/modals/members-modal";
import { LanguageModal } from "@/components/modals/language-modal";
import { AccountSecurityModal } from "@/components/modals/account-security-modal";

export function ModalHost() {
  const { activeModal, closeModal, modalPayload } = useAppStore();
  const close = closeModal;

  return (
    <>
      <SaleModal open={activeModal === "sale"} onClose={close} />
      <PurchaseModal open={activeModal === "purchase"} onClose={close} />
      <ExpenseModal open={activeModal === "expense"} onClose={close} />
      <PaymentModal
        open={activeModal === "receive_payment" || activeModal === "pay_payment"}
        type={activeModal === "pay_payment" ? "supplier_payment" : "customer_payment"}
        presetPartyId={modalPayload?.id}
        onClose={close}
      />
      <ProductModal
        open={activeModal === "add_product" || activeModal === "edit_product"}
        product={activeModal === "edit_product" ? modalPayload : null}
        onClose={close}
      />
      <CustomerModal open={activeModal === "add_customer"} onClose={close} />
      <SupplierModal open={activeModal === "add_supplier"} onClose={close} />
      <StockAdjustmentModal open={activeModal === "stock_adjustment"} product={modalPayload} onClose={close} />
      <StockHistoryModal open={activeModal === "stock_history"} product={modalPayload} onClose={close} />
      <InvoiceModal open={activeModal === "invoice"} saleId={modalPayload?.saleId} onClose={close} />
      <CustomerDetailsModal open={activeModal === "customer_details"} customerId={modalPayload?.id} onClose={close} />
      <SupplierDetailsModal open={activeModal === "supplier_details"} supplierId={modalPayload?.id} onClose={close} />
      <NotificationsModal open={activeModal === "notifications"} onClose={close} />
      <BackupModal open={activeModal === "backup"} onClose={close} />
      <ShopSetupModal open={activeModal === "shop_setup"} onClose={close} />
      <ChangePasswordModal open={activeModal === "change_password"} onClose={close} />
      <ChangeCredentialsModal open={activeModal === "change_credentials"} onClose={close} />
      <MembersModal open={activeModal === "members"} onClose={close} />
      <LanguageModal open={activeModal === "language"} onClose={close} />
      <AccountSecurityModal open={activeModal === "account_security"} onClose={close} />
    </>
  );
}

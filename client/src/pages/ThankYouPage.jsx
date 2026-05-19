import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  CheckCircle2,
  CreditCard,
  Download,
  MapPin,
  PackageCheck,
  Phone,
  Printer,
  ReceiptText,
  Store,
  UserRound,
} from "lucide-react";
import HomeFeedbackSection from "../components/HomeFeedbackSection";
import { resolveMediaUrl } from "../utils/media";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";
const LOGO_SRC = "/images/zesto.png";

export default function ThankYouPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loadingOrder, setLoadingOrder] = useState(!location.state?.order);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled && res.data.order) {
          setOrder(res.data.order);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoadingOrder(false);
        }
      }
    };

    fetchOrder();

    if (location.state?.order) {
      setLoadingOrder(false);
    }

    return () => {
      cancelled = true;
    };
  }, [location.state?.order, orderId]);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeedbackPopup(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  const invoiceData = useMemo(() => {
    if (!order) return null;

    const taxPercent = 18;
    const subTotal = Number(order.totalPrice || 0);
    const taxAmount = Number(((subTotal * taxPercent) / 100).toFixed(2));
    const grandTotal = Number((subTotal + taxAmount).toFixed(2));
    const itemRows = (order.foodItems || []).map((item, index) => ({
      ...item,
      total: Number(item.quantity || 0) * Number(item.price || 0),
      image: resolveMediaUrl(order.items?.[index]?.food?.image, API_BASE),
    }));

    return {
      taxPercent,
      subTotal,
      taxAmount,
      grandTotal,
      itemRows,
    };
  }, [order]);

  if ((!order || !invoiceData) && loadingOrder) {
    return (
      <div className="public-shell flex min-h-screen items-center justify-center text-slate-200">
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 text-center shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Generating Invoice</p>
          <p className="mt-3 text-lg font-medium text-white">Payment successful. Preparing your invoice...</p>
          <p className="mt-2 text-sm text-slate-300">Please wait while we load the order details.</p>
        </div>
      </div>
    );
  }

  if (!order || !invoiceData) {
    return (
      <div className="public-shell flex min-h-screen items-center justify-center text-slate-200">
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 text-center shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">Invoice Unavailable</p>
          <p className="mt-3 text-lg font-medium text-white">We could not load this order invoice.</p>
          <p className="mt-2 text-sm text-slate-300">Please refresh once or open My Orders to view the latest status.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/my-orders" className="public-button public-button-primary">
              My Orders
            </Link>
            <Link to="/checkout" className="public-button public-button-secondary">
              Back to Checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const downloadInvoice = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 14;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 7;

      pdf.addImage(imgData, "PNG", 7, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight - 14;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 7;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 7, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight - 14;
      }

      pdf.save(`zestycart-invoice-${order._id}.pdf`);
    } catch (error) {
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="public-shell">
      <div className="public-section pt-24">
        <section className="public-hero rounded-[36px] px-8 py-10 text-white print:hidden">
          <div className="public-pill">Order confirmed</div>
          <div className="mt-6 flex items-center gap-4">
            <CheckCircle2 size={44} className="text-emerald-300" />
            <div>
              <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">Thank you. Your order is confirmed.</h1>
              <p className="mt-3 text-base text-emerald-100/75">
                Invoice generated for order #{order._id.slice(-8)}.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div
            ref={invoiceRef}
            className="rounded-[36px] border border-white/40 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_35%,#ecfeff_100%)] p-6 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.22)] print:rounded-none print:border-none print:shadow-none print:p-0"
          >
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.26),_transparent_28%),linear-gradient(135deg,#031b16_0%,#06231e_42%,#0f172a_100%)] px-8 py-8 text-white">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-[24px] bg-white/10 p-3 backdrop-blur">
                      <img src={LOGO_SRC} alt="ZestyCart" className="h-14 w-14 rounded-2xl object-cover" />
                    </div>
                    <div>
                      <p className="text-3xl font-semibold tracking-tight">ZestyCart</p>
                      <p className="mt-1 text-sm uppercase tracking-[0.35em] text-emerald-200/80">Food Ordering</p>
                      <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
                        Order invoice with customer, restaurant and payment details.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/75">Invoice</p>
                    <p className="mt-2 text-2xl font-semibold">#{order._id.slice(-10)}</p>
                    <p className="mt-2 text-slate-300">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-8 py-8 lg:grid-cols-3">
                <InfoCard
                  icon={<Store size={18} />}
                  title="Restaurant"
                  lines={[
                    order.restaurant?.name || "ZestyCart Partner Kitchen",
                    `Status: ${order.status || "placed"}`,
                    `Payment: ${order.paymentMethod || "COD"} / ${order.paymentStatus || "pending"}`,
                  ]}
                />
                <InfoCard
                  icon={<UserRound size={18} />}
                  title="Customer"
                  lines={[
                    order.user?.name || "Customer",
                    order.user?.email || "No email",
                    `Mobile: ${order.mobile || "N/A"}`,
                  ]}
                />
                <InfoCard
                  icon={<MapPin size={18} />}
                  title="Delivery Address"
                  lines={[order.address || "No address provided"]}
                />
              </div>

              <div className="px-8 pb-8">
                <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc,#ffffff)] p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <ReceiptText size={18} className="text-emerald-700" />
                    <h2 className="text-xl font-semibold text-slate-950">Invoice Details</h2>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200">
                    <table className="min-w-full">
                      <thead className="bg-slate-950 text-left text-xs uppercase tracking-[0.2em] text-slate-300">
                        <tr>
                          <th className="px-5 py-4">Item</th>
                          <th className="px-5 py-4">Qty</th>
                          <th className="px-5 py-4">Rate</th>
                          <th className="px-5 py-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {invoiceData.itemRows.map((item, index) => (
                          <tr key={`${item.name}-${index}`}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-4">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                                  onError={(event) => {
                                    event.currentTarget.src = `${API_BASE}/uploads/placeholder-restaurant.svg`;
                                  }}
                                />
                                <div>
                                  <p className="text-base font-semibold text-slate-950">{item.name}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                                    Menu item
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-slate-700">{item.quantity}</td>
                            <td className="px-5 py-4 text-sm font-medium text-slate-700">Rs {item.price}</td>
                            <td className="px-5 py-4 text-sm font-semibold text-emerald-700">Rs {item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="rounded-[24px] bg-[linear-gradient(135deg,#ecfccb,#d1fae5)] px-5 py-5">
                      <div className="flex items-center gap-3 text-slate-900">
                        <Phone size={18} />
                        <p className="text-sm font-medium">
                          Need help with this order? Use Help Center or contact restaurant support with invoice id{" "}
                          <span className="font-semibold">#{order._id.slice(-10)}</span>.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[24px] bg-slate-950 px-5 py-5 text-white">
                      <div className="flex items-center gap-3">
                        <PackageCheck size={18} />
                        <p className="text-lg font-semibold">Billing Summary</p>
                      </div>
                      <div className="mt-5 space-y-3 text-sm text-slate-300">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>Rs {invoiceData.subTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST ({invoiceData.taxPercent}%)</span>
                          <span>Rs {invoiceData.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Method</span>
                          <span className="inline-flex items-center gap-2">
                            <CreditCard size={14} />
                            {order.paymentMethod || "COD"}
                          </span>
                        </div>
                        <div className="border-t border-white/10 pt-4 text-2xl font-semibold text-emerald-300">
                          Grand Total Rs {invoiceData.grandTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 print:hidden">
            <div className="public-card rounded-[32px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Export</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Invoice Actions</h2>
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={downloadInvoice}
                  disabled={downloading}
                  className="public-button public-button-primary"
                >
                  <Download size={16} />
                  {downloading ? "Preparing PDF..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={printInvoice}
                  className="public-button public-button-secondary bg-slate-950 text-white"
                >
                  <Printer size={16} />
                  Print / Save PDF
                </button>
              </div>
            </div>

            <div className="public-card rounded-[32px] p-6">
              <div className="rounded-[26px] bg-slate-950 px-5 py-5 text-white">
                <div className="flex items-center gap-3">
                  <PackageCheck size={18} />
                  <p className="text-lg font-semibold">Summary</p>
                </div>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <div className="flex justify-between"><span>Items</span><span>{invoiceData.itemRows.length}</span></div>
                  <div className="flex justify-between"><span>Subtotal</span><span>Rs {invoiceData.subTotal}</span></div>
                  <div className="flex justify-between"><span>GST</span><span>Rs {invoiceData.taxAmount.toFixed(2)}</span></div>
                  <div className="border-t border-white/10 pt-3 text-xl font-semibold text-emerald-300">
                    Grand Total Rs {invoiceData.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <Link to="/" className="public-button public-button-primary">
                  Continue Shopping
                </Link>
                <Link to="/my-orders" className="public-button public-button-secondary">
                  My Orders
                </Link>
              </div>
            </div>
          </aside>
        </section>

        {showFeedbackPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
            <div className="public-card relative w-full max-w-2xl rounded-[32px] p-6">
              <button
                type="button"
                onClick={() => setShowFeedbackPopup(false)}
                className="absolute right-4 top-4 rounded-full bg-rose-50 px-3 py-2 text-sm text-rose-600"
              >
                Close
              </button>

              {!feedbackSubmitted ? (
                <HomeFeedbackSection onSubmitSuccess={() => setFeedbackSubmitted(true)} />
              ) : (
                <div className="py-10 text-center">
                  <h2 className="text-2xl font-semibold text-slate-950">Thank you for your feedback.</h2>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, title, lines }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-5 py-5">
      <div className="flex items-center gap-3 text-slate-900">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">{icon}</div>
        <p className="text-lg font-semibold">{title}</p>
      </div>
      <div className="mt-4 space-y-2">
        {lines.map((line, index) => (
          <p key={`${title}-${index}`} className="text-sm leading-7 text-slate-600">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

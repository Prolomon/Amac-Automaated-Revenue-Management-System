"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Check,
  AlertCircle,
  Copy,
  Calendar,
  Sparkles,
  Info,
  CreditCard,
  ChevronDown,
  UploadCloud,
  X,
  Image as ImageIcon,
  Home,
  FileCheck,
} from "lucide-react";
import { getPublicCenters, PublicCenter } from "@/lib/services/admin";
import { createMember, Member, Frequency, getProperties, Property } from "@/lib/services/member";
import { getPublicPricing, Pricing } from "@/lib/services/pricing";
import { uploadImagesToCloudinary } from "@/lib/services/upload";
import statesData from "@/lib/jsons/state_and_lgas.json";
import { useToast } from "@/context/ToastContext";

const CATEGORY_OPTIONS = [
  { value: "TENEMENT RENT ZONE A", label: "Tenement Rent Zone A", group: "Tenement & Property" },
  { value: "TENEMENT RENT ZONE B", label: "Tenement Rent Zone B", group: "Tenement & Property" },
  { value: "TENEMENT RENT ZONE C", label: "Tenement Rent Zone C", group: "Tenement & Property" },
  { value: "TENEMENT RENT ZONE D", label: "Tenement Rent Zone D", group: "Tenement & Property" },
  { value: "SHOP AND KIOSK ZONE A & B", label: "Shop and Kiosk Zone A & B", group: "Commercial & Retail" },
  { value: "SHOP AND KIOSK ZONE C", label: "Shop and Kiosk Zone C", group: "Commercial & Retail" },
  { value: "SHOP AND KIOSK ZONE D", label: "Shop and Kiosk Zone D", group: "Commercial & Retail" },
  { value: "AMAC MARKETS", label: "AMAC Municipal Markets", group: "Commercial & Retail" },
  { value: "HOTELS", label: "Hotels & Hospitality", group: "Hospitality & Food" },
  { value: "FOOD HANDLING", label: "Food Handling & Eateries", group: "Hospitality & Food" },
  { value: "LIQUOR", label: "Liquor & Entertainment", group: "Hospitality & Food" },
  { value: "BANKS", label: "Banks & Financial Institutions", group: "Corporate & Finance" },
  { value: "CORPORATE PARKING", label: "Corporate Parking Services", group: "Corporate & Finance" },
  { value: "FILING STATION", label: "Filing Station & Petroleum", group: "Energy & Utilities" },
  { value: "SIGN POST", label: "Sign Post & Outdoor Display", group: "Advert & Media" },
  { value: "MOBILE ADVERT", label: "Mobile Advert & Vehicles", group: "Advert & Media" },
  { value: "TV AND RADIO", label: "TV and Radio Broadcast", group: "Advert & Media" },
  { value: "SANITARY INSPECTION", label: "Sanitary Inspection & Waste", group: "Environmental" },
  { value: "HABITATION", label: "Habitation & Residential", group: "Residential" },
  { value: "MARRIAGE REGISTRY", label: "Marriage Registry Services", group: "Civic Services" },
];

const ZONE_OPTIONS = ["A", "B", "C", "D", "E"];

const PROPERTY_TYPES = [
  "Commercial",
  "Residential",
  "Shop / Kiosk",
  "Office / Suite",
  "Warehouse / Industrial",
  "Hotel / Guest House",
  "Filling Station",
  "Land / Open Space",
  "Other",
];

const STEPS = [
  { id: 1, title: "Center & Type", desc: "Council center & classification" },
  { id: 2, title: "Entity Details", desc: "Proprietor & contact info" },
  { id: 3, title: "Identity Document", desc: "CAC, NIN or government ID" },
  { id: 4, title: "Property Details", desc: "Premises & Cloudinary images" },
  { id: 5, title: "Location", desc: "Premises physical address" },
  { id: 6, title: "Tariffs & Review", desc: "Revenue heads & confirmation" },
];

export default function RegisterEntityPage() {
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [centers, setCenters] = useState<PublicCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  const [pricingList, setPricingList] = useState<Pricing[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const [formData, setFormData] = useState({
    center: "",
    type: "BUSINESS" as "BUSINESS" | "INDIVIDUAL",
    category: "",
    zone: "A",
    fullname: "",
    businessName: "",
    email: "",
    phone: "",
    billingFrequency: "MONTHLY" as Frequency,
    state: "Abuja",
    city: "Abuja Municipal Area Council",
    address: "",
    nearestBusStop: "",
    zipcode: "",
    pricing: [] as string[],
    agreedToTerms: false,
    document: {
      type: "cac",
      number: "",
      data: null as any,
    },
    property: {
      name: "",
      type: "Commercial",
      size: "",
      images: [] as string[],
    },
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [registeredEntity, setRegisteredEntity] = useState<any>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const [existingProperties, setExistingProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [isExistingProperty, setIsExistingProperty] = useState(false);
  const [selectedExistingPropertyId, setSelectedExistingPropertyId] = useState("");

  // Load registered existing properties
  useEffect(() => {
    async function loadProperties() {
      setLoadingProperties(true);
      try {
        const res = await getProperties();
        if (res?.ok && Array.isArray(res?.data)) {
          setExistingProperties(res.data);
        }
      } catch (err) {
        console.error("Failed to load existing properties:", err);
      } finally {
        setLoadingProperties(false);
      }
    }
    loadProperties();
  }, []);

  const handleSelectExistingProperty = (propId: string) => {
    setSelectedExistingPropertyId(propId);
    const found = existingProperties.find((p) => p.id === propId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        property: {
          name: found.name || "",
          type: found.type || "Commercial",
          size: found.size || "",
          images: Array.isArray(found.images) ? [...found.images] : [],
        },
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next["property.name"];
        delete next["property.size"];
        delete next.existingProperty;
        return next;
      });
    }
  };

  // Load public revenue centers
  useEffect(() => {
    async function loadCenters() {
      setLoadingCenters(true);
      try {
        const res = await getPublicCenters();
        const activeCenters = Array.isArray(res?.data) ? res.data : [];
        setCenters(activeCenters);

        if (activeCenters.length > 0) {
          setFormData((prev) => ({
            ...prev,
            center: activeCenters[0].uid || activeCenters[0].id,
            state: activeCenters[0].state || prev.state,
            city: activeCenters[0].lga || prev.city,
          }));
        }
      } catch (err: any) {
        console.error("Failed to load centers:", err);
        const fallbackCenter: PublicCenter = {
          id: "amac-central",
          uid: "AMAC-HQ",
          center: "Abuja Municipal Area Council (AMAC) Secretariat",
          state: "Abuja",
          lga: "Abuja Municipal Area Council",
          address: "AMAC Secretariat, Area 10, Garki, Abuja",
          status: true,
        };
        setCenters([fallbackCenter]);
        setFormData((prev) => ({
          ...prev,
          center: prev.center || fallbackCenter.uid,
        }));
      } finally {
        setLoadingCenters(false);
      }
    }

    loadCenters();
  }, []);

  // Fetch available pricing tariffs when center changes
  const fetchPricingForCenter = useCallback(async (centerUid: string) => {
    if (!centerUid) return;
    setLoadingPricing(true);
    try {
      const res = await getPublicPricing(centerUid);
      const items = Array.isArray(res?.data) ? res.data : [];
      setPricingList(items);
    } catch (err) {
      console.warn("Public pricing fetch warning:", err);
      setPricingList([]);
    } finally {
      setLoadingPricing(false);
    }
  }, []);

  useEffect(() => {
    if (formData.center) {
      fetchPricingForCenter(formData.center);
    }
  }, [formData.center, fetchPricingForCenter]);

  const selectedCenterDetails = useMemo(() => {
    return centers.find((c) => (c.uid || c.id) === formData.center) || null;
  }, [centers, formData.center]);

  const statesList = useMemo(() => {
    const keys = Object.keys(statesData || {});
    return keys.sort();
  }, []);

  const availableLgas = useMemo(() => {
    if (!formData.state) return [];
    const normalized = Object.keys(statesData).find(
      (s) => s.toLowerCase() === formData.state.toLowerCase()
    );
    if (!normalized) return [];
    return (statesData as Record<string, string[]>)[normalized] || [];
  }, [formData.state]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "state") {
        const nextLgas = (statesData as Record<string, string[]>)[value] || [];
        if (nextLgas.length > 0 && !nextLgas.includes(prev.city)) {
          updated.city = nextLgas[0];
        }
      }

      if (field === "center") {
        const chosen = centers.find((c) => (c.uid || c.id) === value);
        if (chosen) {
          if (chosen.state) updated.state = chosen.state;
          if (chosen.lga) updated.city = chosen.lga;
        }
      }

      if (field === "type") {
        // Automatically sync document type default based on constitution
        updated.document = {
          ...prev.document,
          type: value === "BUSINESS" ? "cac" : "nin",
        };
      }

      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const clone = { ...prev };
        delete clone[field];
        return clone;
      });
    }
  };

  const handleDocumentChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      document: {
        ...prev.document,
        [field]: value,
      },
    }));

    if (errors[`document.${field}`]) {
      setErrors((prev) => {
        const clone = { ...prev };
        delete clone[`document.${field}`];
        return clone;
      });
    }
  };

  const handlePropertyChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      property: {
        ...prev.property,
        [field]: value,
      },
    }));

    if (errors[`property.${field}`]) {
      setErrors((prev) => {
        const clone = { ...prev };
        delete clone[`property.${field}`];
        return clone;
      });
    }
  };

  const handlePropertyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const base64List: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        base64List.push(base64);
      }

      const uploadRes = await uploadImagesToCloudinary(base64List);
      const newUrls = uploadRes?.urls || base64List;
      setFormData((prev) => ({
        ...prev,
        property: {
          ...prev.property,
          images: [...prev.property.images, ...newUrls],
        },
      }));
      addToast("success", `${newUrls.length} image(s) uploaded to Cloudinary!`);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      addToast("error", err?.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemovePropertyImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      property: {
        ...prev.property,
        images: prev.property.images.filter((_, idx) => idx !== indexToRemove),
      },
    }));
  };

  const togglePricingSelection = (pricingId: string) => {
    setFormData((prev) => {
      const exists = prev.pricing.includes(pricingId);
      return {
        ...prev,
        pricing: exists
          ? prev.pricing.filter((id) => id !== pricingId)
          : [...prev.pricing, pricingId],
      };
    });
  };

  // Step Validations
  const validateStep = (stepNumber: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.center) errs.center = "Please select a revenue center";
      if (!formData.type) errs.type = "Please select entity classification";
      if (!formData.category) errs.category = "Please choose an entity category";
    }

    if (stepNumber === 2) {
      if (!formData.fullname || formData.fullname.trim().length < 3) {
        errs.fullname = "Full name must be at least 3 characters";
      }
      if (formData.type === "BUSINESS" && (!formData.businessName || formData.businessName.trim().length < 2)) {
        errs.businessName = "Registered business / enterprise name is required";
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.email = "Please enter a valid email address";
      }
      const cleanPhone = formData.phone.replace(/[^0-9+]/g, "");
      if (!formData.phone || cleanPhone.length < 10) {
        errs.phone = "Enter a valid phone number (at least 10 digits)";
      }
    }

    if (stepNumber === 3) {
      if (!formData.document.number || formData.document.number.trim().length < 3) {
        errs["document.number"] = formData.type === "BUSINESS"
          ? "Please provide the official CAC Registration Number (RC/BN)"
          : "Please enter your valid document identification number";
      }
    }

    if (stepNumber === 4) {
      if (isExistingProperty && !selectedExistingPropertyId) {
        errs.existingProperty = "Please select an existing property from the list";
      }
      if (!formData.property.name || formData.property.name.trim().length < 2) {
        errs["property.name"] = "Please enter property or business premises name";
      }
      if (!formData.property.size || formData.property.size.trim().length < 1) {
        errs["property.size"] = "Please specify property size or physical dimension";
      }
    }

    if (stepNumber === 5) {
      if (!formData.state) errs.state = "Please select state";
      if (!formData.city) errs.city = "Please select LGA / Area Council";
      if (!formData.address || formData.address.trim().length < 5) {
        errs.address = "Detailed street / premises address is required";
      }
    }

    if (stepNumber === 6) {
      for (let s = 1; s <= 5; s++) {
        if (!validateStep(s)) return false;
      }
      if (!formData.agreedToTerms) {
        errs.agreedToTerms = "You must accept the revenue registration declaration to proceed";
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0];
      addToast("error", firstError);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJumpToStep = (targetStep: number) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (targetStep === currentStep + 1 && validateStep(currentStep)) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if not on the final review step
    if (currentStep < STEPS.length) {
      handleNext();
      return;
    }

    // Verify all steps before submitting
    for (let s = 1; s <= STEPS.length; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload: any = {
        fullname: formData.fullname.trim(),
        businessName: formData.type === "BUSINESS" ? formData.businessName.trim() : (formData.businessName.trim() || undefined),
        center: formData.center,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        type: formData.type,
        category: formData.category as any,
        zone: formData.zone || "A",
        billingFrequency: formData.billingFrequency,
        pricing: Array.from(new Set(formData.pricing)),
        location: {
          state: formData.state,
          city: formData.city,
          address: formData.address.trim(),
          nearestBusStop: formData.nearestBusStop.trim(),
          zipcode: formData.zipcode.trim() || "0",
        },
        document: {
          type: formData.document.type,
          number: formData.document.number.trim(),
          data: null,
        },
        property: {
          id: (isExistingProperty && selectedExistingPropertyId) ? selectedExistingPropertyId : undefined,
          pid: (isExistingProperty && selectedExistingPropertyId) ? existingProperties.find((p) => p.id === selectedExistingPropertyId)?.pid : undefined,
          name: formData.property.name.trim(),
          type: formData.property.type.trim(),
          size: formData.property.size.trim(),
          images: formData.property.images,
        },
      };

      const res = await createMember(payload);

      if (!res?.ok && !res?.member) {
        throw new Error(res?.message || res?.error || "Registration could not be completed.");
      }

      const entityData = res.member || res.data || payload;
      setRegisteredEntity(entityData);
      addToast("success", "Entity registered successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Entity registration error:", err);
      const errMsg = err?.message || "Registration failed. Please check your details and try again.";
      setSubmitError(errMsg);
      addToast("error", errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUid(true);
    addToast("success", "Entity ID copied to clipboard!");
    setTimeout(() => setCopiedUid(false), 2500);
  };

  const handleReset = () => {
    setRegisteredEntity(null);
    setCurrentStep(1);
    setFormData({
      center: centers[0]?.uid || centers[0]?.id || "",
      type: "BUSINESS",
      category: "SHOP AND KIOSK ZONE A & B",
      zone: "A",
      fullname: "",
      businessName: "",
      email: "",
      phone: "",
      billingFrequency: "MONTHLY",
      state: "Abuja",
      city: "Abuja Municipal Area Council",
      address: "",
      nearestBusStop: "",
      zipcode: "",
      pricing: [],
      agreedToTerms: false,
      document: {
        type: "cac",
        number: "",
        data: null,
      },
      property: {
        name: "",
        type: "Commercial",
        size: "",
        images: [],
      },
    });
    setErrors({});
    setSubmitError("");
  };

  // =========================================================================
  // SUCCESS SCREEN
  // =========================================================================
  if (registeredEntity) {
    const entityUid = registeredEntity.uid || registeredEntity.id || "MEB-SUCCESS";
    return (
      <div className="min-h-screen bg-linear-to-b from-emerald-50 via-white to-cyan-50 py-12 px-4 md:px-6">
        <main className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 md:p-10 shadow-xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
              <CheckCircle size={44} />
            </div>

            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <Sparkles size={14} /> Official Registration Complete
            </span>

            <h1 className="mt-3 text-2xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Entity Registered Successfully!
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-xl mx-auto">
              Your entity and premises have been registered in the Unified Revenue Management System. You can now use your Entity ID to manage council assessments and make direct payments.
            </p>

            {/* Generated Entity ID Card */}
            <div className="mt-8 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Official Entity Identification Number
              </p>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="font-mono text-2xl md:text-3xl font-bold text-emerald-950 tracking-wider">
                  {entityUid}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(entityUid)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  {copiedUid ? <Check size={16} /> : <Copy size={16} />}
                  {copiedUid ? "Copied!" : "Copy Entity ID"}
                </button>
              </div>
            </div>

            {/* Entity Summary Details */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-left text-sm divide-y divide-slate-200">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Business / Entity Name:</span>
                <span className="font-semibold text-slate-800">
                  {registeredEntity.businessName || registeredEntity.fullname || "—"}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Primary Contact Person:</span>
                <span className="font-semibold text-slate-800">{registeredEntity.fullname}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Registered Document:</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {formData.document.type} ({formData.document.number})
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Registered Property:</span>
                <span className="font-semibold text-slate-800">
                  {formData.property.name} &bull; {formData.property.type} ({formData.property.size})
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Premises Address:</span>
                <span className="font-semibold text-slate-800">
                  {formData.address}, {formData.city}, {formData.state}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Supervising Revenue Center:</span>
                <span className="font-semibold text-emerald-800">
                  {selectedCenterDetails?.center || formData.center}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`{/payment/${registeredEntity.uid || registeredEntity.id}/checkout`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <CreditCard size={16} />
                Proceed to Make Payment
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Register Another Entity
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // MAIN REGISTRATION FORM WIZARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 md:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header Banner */}
        <div className="rounded-3xl bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 md:p-8 text-white shadow-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-xs px-3.5 py-1 text-xs font-medium text-emerald-100 ring-1 ring-white/20">
            <ShieldCheck size={14} /> Official AMAC Revenue Portal
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
            New Entity & Premises Registration
          </h1>
          <p className="mt-1.5 text-sm md:text-base text-emerald-100 max-w-2xl">
            Register your enterprise or individual property to obtain an official Taxpayer Identification UID and access council services.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {STEPS.map((step) => {
              const isCurrent = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleJumpToStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex flex-col items-start gap-1 rounded-xl p-2.5 text-left transition-all ${
                    isCurrent
                      ? "bg-emerald-50 border border-emerald-300 ring-1 ring-emerald-200 shadow-xs"
                      : isCompleted
                      ? "hover:bg-slate-50 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-[11px] transition-colors ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-emerald-800 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <Check size={13} /> : step.id}
                    </div>
                    <p
                      className={`text-xs font-bold truncate ${
                        isCurrent ? "text-emerald-950" : isCompleted ? "text-slate-800" : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
          <form
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                e.preventDefault();
                if (currentStep < STEPS.length) {
                  handleNext();
                }
              }
            }}
          >
            {/* STEP 1: Center & Classification */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 1: Revenue Center & Classification
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Select your supervising revenue center and specify whether you are registering as a commercial business or an individual.
                  </p>
                </div>

                {/* Revenue Center with appearance-none */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Designated Revenue Center *
                  </label>
                  {loadingCenters ? (
                    <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.center}
                        onChange={(e) => handleInputChange("center", e.target.value)}
                        className={`appearance-none w-full rounded-xl border bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                          errors.center ? "border-red-400" : "border-slate-300"
                        }`}
                      >
                        <option value="" hidden>
                          Select Council Revenue Center
                        </option>
                        {centers.map((c) => (
                          <option key={c.uid || c.id} value={c.uid || c.id}>
                            {c.center} ({c.uid || c.id}) {c.lga ? `- ${c.lga}` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    </div>
                  )}
                  {errors.center && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={13} /> {errors.center}
                    </p>
                  )}
                </div>

                {/* Entity Constitution Selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-800">
                    Entity Type / Legal Constitution *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => handleInputChange("type", "BUSINESS")}
                      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                        formData.type === "BUSINESS"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-100"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            formData.type === "BUSINESS"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Building2 size={22} />
                        </div>
                        <input
                          type="radio"
                          name="pubEntityType"
                          checked={formData.type === "BUSINESS"}
                          onChange={() => handleInputChange("type", "BUSINESS")}
                          className="h-4 w-4 text-emerald-600 accent-emerald-600 mt-1"
                        />
                      </div>
                      <h3 className="mt-3 font-bold text-slate-900 text-base">
                        Business / Corporate Entity
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        Registered company, commercial shop, hotel, market vendor, bank, or retail establishment.
                      </p>
                    </div>

                    <div
                      onClick={() => handleInputChange("type", "INDIVIDUAL")}
                      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                        formData.type === "INDIVIDUAL"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-100"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            formData.type === "INDIVIDUAL"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <User size={22} />
                        </div>
                        <input
                          type="radio"
                          name="pubEntityType"
                          checked={formData.type === "INDIVIDUAL"}
                          onChange={() => handleInputChange("type", "INDIVIDUAL")}
                          className="h-4 w-4 text-emerald-600 accent-emerald-600 mt-1"
                        />
                      </div>
                      <h3 className="mt-3 font-bold text-slate-900 text-base">
                        Individual / Property Owner
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        Private property landlord, residential ratepayer, tenant, or sole individual.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category & Rating Zone with appearance-none */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Revenue Head / Category *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="">Select Entity Category</option>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label} ({cat.group})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Municipal Valuation Zone
                    </label>
                    <div className="flex gap-2">
                      {ZONE_OPTIONS.map((zone) => (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => handleInputChange("zone", zone)}
                          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                            formData.zone === zone
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          Zone {zone}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Entity & Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 2: Entity & Contact Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Provide legal contact credentials and assessment billing schedule.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={formData.type === "INDIVIDUAL" ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      {formData.type === "BUSINESS" ? "Contact Representative Full Name *" : "Full Legal Name *"}
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="e.g., Musa Ibrahim"
                        value={formData.fullname}
                        onChange={(e) => handleInputChange("fullname", e.target.value)}
                        className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                          errors.fullname ? "border-red-400" : "border-slate-300"
                        }`}
                      />
                    </div>
                    {errors.fullname && (
                      <p className="mt-1 text-xs text-red-600">{errors.fullname}</p>
                    )}
                  </div>

                  {formData.type === "BUSINESS" && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Registered Business / Enterprise Name *
                      </label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="e.g., Summit Logistics Global Ltd"
                          value={formData.businessName}
                          onChange={(e) => handleInputChange("businessName", e.target.value)}
                          className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                            errors.businessName ? "border-red-400" : "border-slate-300"
                          }`}
                        />
                      </div>
                      {errors.businessName && (
                        <p className="mt-1 text-xs text-red-600">{errors.businessName}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Official Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="email"
                        placeholder="e.g., info@company.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                          errors.email ? "border-red-400" : "border-slate-300"
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Official Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="tel"
                        placeholder="e.g., 08031234567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                          errors.phone ? "border-red-400" : "border-slate-300"
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Billing / Assessment Frequency
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["MONTHLY", "QUARTERLY", "YEARLY"] as Frequency[]).map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => handleInputChange("billingFrequency", freq)}
                          className={`rounded-xl border p-3 text-center transition ${
                            formData.billingFrequency === freq
                              ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-200"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Calendar className="mx-auto h-4 w-4 mb-1 text-emerald-700" />
                          <span className="text-xs capitalize">{freq.toLowerCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Identification Document */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 3: Identification Document
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Provide the official statutory identification document for verification.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-start gap-3">
                  <FileCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900">
                    {formData.type === "BUSINESS" ? (
                      <p>
                        <strong>CAC Requirement:</strong> Business entities are verified using their <strong>Corporate Affairs Commission (CAC)</strong> RC or Business Name (BN) number.
                      </p>
                    ) : (
                      <p>
                        <strong>Individual Identification:</strong> Individual taxpayers may present their <strong>National Identity Number (NIN)</strong>, International Passport, Voter&apos;s Card, or Driver&apos;s License.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Document Type *
                    </label>
                    <div className="relative">
                      {formData.type === "BUSINESS" ? (
                        <input
                          type="text"
                          readOnly
                          value="CAC Registration Certificate (RC / BN)"
                          className="w-full rounded-xl border border-slate-300 bg-slate-100 py-2.5 px-4 text-sm font-medium text-slate-700 cursor-not-allowed"
                        />
                      ) : (
                        <>
                          <select
                            value={formData.document.type}
                            onChange={(e) => handleDocumentChange("type", e.target.value)}
                            className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                          >
                            <option value="nin">National Identity Number (NIN)</option>
                            <option value="passport">International Passport</option>
                            <option value="voters card">Voter&apos;s Identification Card (VIN)</option>
                            <option value="drivers lincense">Driver&apos;s License</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      {formData.type === "BUSINESS"
                        ? "CAC Number (e.g. RC-1234567 or BN-1234567) *"
                        : "Identification Document Number *"}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        formData.type === "BUSINESS"
                          ? "e.g., RC-1849201"
                          : formData.document.type === "nin"
                          ? "e.g., 12345678901 (11 digits)"
                          : "e.g., A12345678"
                      }
                      value={formData.document.number}
                      onChange={(e) => handleDocumentChange("number", e.target.value)}
                      className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                        errors["document.number"] ? "border-red-400" : "border-slate-300"
                      }`}
                    />
                    {errors["document.number"] && (
                      <p className="mt-1 text-xs text-red-600">{errors["document.number"]}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Property Details with Cloudinary Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 4: Property & Premises Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Record property specifications and upload photographic evidence directly to Cloudinary.
                  </p>
                </div>

                {/* Select for Existing Property */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                        Existing Property? *
                      </label>
                      <div className="relative">
                        <select
                          value={isExistingProperty ? "yes" : "no"}
                          onChange={(e) => {
                            const isYes = e.target.value === "yes";
                            setIsExistingProperty(isYes);
                            if (!isYes) {
                              setSelectedExistingPropertyId("");
                            }
                          }}
                          className="appearance-none w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="no">No (Register New Property)</option>
                          <option value="yes">Yes (Select Existing Property)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Choose whether this entity occupies an already registered property or plaza.
                      </p>
                    </div>

                    {isExistingProperty && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                          Select From Existing Properties *
                        </label>
                        <div className="relative">
                          <select
                            value={selectedExistingPropertyId}
                            onChange={(e) => handleSelectExistingProperty(e.target.value)}
                            className={`appearance-none w-full rounded-xl border bg-white py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
                              errors.existingProperty ? "border-red-400" : "border-slate-300"
                            }`}
                          >
                            <option value="">
                              {loadingProperties
                                ? "Loading registered properties..."
                                : existingProperties.length === 0
                                  ? "No registered properties found"
                                  : "-- Select already existing property --"}
                            </option>
                            {existingProperties.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.pid ? `[${p.pid}] ` : ""}{p.name} — {p.type} ({p.size || "Standard"})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        </div>
                        {errors.existingProperty && (
                          <p className="mt-1 text-xs text-red-600">{errors.existingProperty}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          Selecting an existing property auto-populates its specifications and photos below.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Property / Premises Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Horizon Plaza Shop 4"
                      value={formData.property.name}
                      onChange={(e) => handlePropertyChange("name", e.target.value)}
                      className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                        errors["property.name"] ? "border-red-400" : "border-slate-300"
                      }`}
                    />
                    {errors["property.name"] && (
                      <p className="mt-1 text-xs text-red-600">{errors["property.name"]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Property Type *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.property.type}
                        onChange={(e) => handlePropertyChange("type", e.target.value)}
                        className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      >
                        {PROPERTY_TYPES.map((pt) => (
                          <option key={pt} value={pt}>
                            {pt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Property Size / Dimension *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 350 sqm, 2 Floors, 1 Shop"
                      value={formData.property.size}
                      onChange={(e) => handlePropertyChange("size", e.target.value)}
                      className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                        errors["property.size"] ? "border-red-400" : "border-slate-300"
                      }`}
                    />
                    {errors["property.size"] && (
                      <p className="mt-1 text-xs text-red-600">{errors["property.size"]}</p>
                    )}
                  </div>
                </div>

                {/* Cloudinary Image Uploader */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-800">
                      Property Images (Cloudinary)
                    </label>
                    <span className="text-xs text-slate-500">
                      {formData.property.images.length} image(s) uploaded
                    </span>
                  </div>

                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition">
                    <UploadCloud className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-800">
                      Upload property photos
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supports JPG, PNG, WEBP. Images are automatically saved to Cloudinary.
                    </p>

                    <label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer">
                      {uploadingImages ? (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Uploading to Cloudinary...
                        </>
                      ) : (
                        <>
                          <ImageIcon size={14} />
                          Browse & Upload Images
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={uploadingImages}
                        onChange={handlePropertyImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Uploaded Images Preview Gallery */}
                  {formData.property.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                      {formData.property.images.map((imgUrl, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Property Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePropertyImage(idx)}
                            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Premises Location */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 5: Physical Premises Location
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Provide the street address, landmark, and council jurisdiction of your premises.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      State *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      >
                        {statesList.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    </div>
                    {errors.state && (
                      <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      LGA / Area Council *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      >
                        {availableLgas.map((lga) => (
                          <option key={lga} value={lga}>
                            {lga}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    </div>
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Detailed Street / Premises Address *
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-3 text-slate-400 h-4 w-4" />
                      <textarea
                        rows={3}
                        placeholder="e.g., Plot 102, Herbert Macaulay Way, Central Business District, Abuja"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                          errors.address ? "border-red-400" : "border-slate-300"
                        }`}
                      />
                    </div>
                    {errors.address && (
                      <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Nearest Landmark / Bus Stop
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Opp. NNPC Towers, Area 11 Junction"
                      value={formData.nearestBusStop}
                      onChange={(e) => handleInputChange("nearestBusStop", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Postal / Zip Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 900211"
                      value={formData.zipcode}
                      onChange={(e) => handleInputChange("zipcode", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Tariffs & Review */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 6: Tariffs & Final Confirmation
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Select applicable revenue heads, inspect the registration summary, and confirm submission.
                  </p>
                </div>

                {/* Tariffs Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-800">
                      Applicable Tariffs / Revenue Heads ({pricingList.length} available)
                    </label>
                    <span className="text-xs text-slate-500">
                      {formData.pricing.length} selected
                    </span>
                  </div>

                  {loadingPricing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[1, 2].map((n) => (
                        <div key={n} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : pricingList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {pricingList.map((item) => {
                        const isSelected = formData.pricing.includes(item.id || (item as any)._id);
                        return (
                          <div
                            key={item.id || (item as any)._id}
                            onClick={() => togglePricingSelection(item.id || (item as any)._id)}
                            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-200"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`text-sm font-bold truncate ${isSelected ? "text-emerald-950" : "text-slate-900"}`}>
                                  {item.title || item.title}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-1">
                                  {item.category || formData.category}
                                </p>
                              </div>
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check size={12} />}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                ₦{Number(item.price || 0).toLocaleString()}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500 uppercase">
                                {item.frequency || "Annual"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                      No tariffs currently listed for this center. Dues will be calculated upon assessment.
                    </div>
                  )}
                </div>

                {/* Comprehensive Registration Summary */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Registration Review Summary
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                      {formData.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Revenue Center</span>
                      <span className="font-semibold text-slate-900">
                        {selectedCenterDetails?.center || formData.center}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Contact Name</span>
                      <span className="font-semibold text-slate-900">{formData.fullname}</span>
                    </div>

                    {formData.type === "BUSINESS" && (
                      <div>
                        <span className="text-slate-500 block">Business Name</span>
                        <span className="font-semibold text-slate-900">{formData.businessName || "—"}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-500 block">Document ({formData.document.type.toUpperCase()})</span>
                      <span className="font-semibold text-slate-900">{formData.document.number}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Property Details</span>
                      <span className="font-semibold text-slate-900">
                        {isExistingProperty && selectedExistingPropertyId && existingProperties.find((p) => p.id === selectedExistingPropertyId)?.pid ? (
                          <span className="inline-block font-mono text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded mr-1.5 font-bold">
                            {existingProperties.find((p) => p.id === selectedExistingPropertyId)?.pid}
                          </span>
                        ) : null}
                        {formData.property.name} &bull; {formData.property.type} ({formData.property.size})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Email & Phone</span>
                      <span className="font-semibold text-slate-900">{formData.email} &bull; {formData.phone}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Premises Address</span>
                      <span className="font-semibold text-slate-900">
                        {formData.address}, {formData.city}, {formData.state}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Category & Zone</span>
                      <span className="font-semibold text-slate-900">
                        {formData.category} (Zone {formData.zone})
                      </span>
                    </div>
                  </div>

                  {formData.property.images.length > 0 && (
                    <div className="border-t border-slate-200 pt-3">
                      <span className="text-slate-500 text-xs block mb-2">Cloudinary Property Photos ({formData.property.images.length}):</span>
                      <div className="flex flex-wrap gap-2">
                        {formData.property.images.map((img, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={img}
                            alt={`Preview ${i + 1}`}
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 shadow-2xs"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => handleInputChange("agreedToTerms", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I declare that the information provided regarding the entity, registered document, and physical premises is true, complete, and conforms to AMAC revenue bylaws.
                    </span>
                  </label>
                  {errors.agreedToTerms && (
                    <p className="mt-1 text-xs text-red-600">{errors.agreedToTerms}</p>
                  )}
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ArrowLeft size={16} />
                  Previous Step
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </Link>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Registering Entity...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Complete Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

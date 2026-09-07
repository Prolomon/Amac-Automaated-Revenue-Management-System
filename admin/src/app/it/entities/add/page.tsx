"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Check,
  AlertCircle,
  Copy,
  Calendar,
  Sparkles,
  ExternalLink,
  Plus,
  ChevronDown,
  UploadCloud,
  X,
  Image as ImageIcon,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Member, createMember, Frequency, getProperties, Property } from "@/lib/services/member";
import { getCompanies, Company } from "@/lib/services/company";
import { getPricingByCenter, Pricing } from "@/lib/services/pricing";
import { getAllAdmins, Admin } from "@/lib/services/admin";
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
  { id: 1, title: "Center & Classification", desc: "Council center, type & category" },
  { id: 2, title: "Entity Details", desc: "Proprietor & contact info" },
  { id: 3, title: "Identity Document", desc: "CAC, NIN or statutory ID" },
  { id: 4, title: "Property Details", desc: "Premises & Cloudinary images" },
  { id: 5, title: "Partner & Location", desc: "Company & premises address" },
  { id: 6, title: "Tariffs & Review", desc: "Revenue heads & confirmation" },
];

export default function ITAddEntityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [centers, setCenters] = useState<Admin[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState("");

  const [formData, setFormData] = useState({
    fullname: "",
    businessName: "",
    email: "",
    phone: "",
    type: "BUSINESS" as "BUSINESS" | "INDIVIDUAL",
    category: "",
    zone: "A",
    billingFrequency: "YEARLY" as Frequency,
    center: "",
    state: "Abuja",
    city: "Abuja Municipal Area Council",
    address: "",
    nearestBusStop: "",
    zipcode: "",
    pricing: [] as string[],
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

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [pricingOptions, setPricingOptions] = useState<Pricing[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registeredEntity, setRegisteredEntity] = useState<any>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const [existingProperties, setExistingProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [isExistingProperty, setIsExistingProperty] = useState(false);
  const [selectedExistingPropertyId, setSelectedExistingPropertyId] = useState("");

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

  // Load all revenue centers (IT admin has global access)
  const fetchCenters = useCallback(async () => {
    setLoadingCenters(true);
    try {
      const res = await getAllAdmins();
      const list = Array.isArray(res?.data) ? res.data : res?.admins || [];
      const activeList = list.filter((a) => a.status !== false);
      setCenters(activeList);

      if (activeList.length > 0 && !selectedCenter) {
        const first = activeList[0];
        const centerUid = first.uid || first.id || "";
        setSelectedCenter(centerUid);
        setFormData((prev) => ({
          ...prev,
          center: centerUid,
          state: first.state || prev.state,
          city: first.lga || prev.city,
        }));
      }
    } catch (e: any) {
      console.warn("Failed to load centers:", e);
      addToast("error", e?.message || "Failed to load revenue centers");
    } finally {
      setLoadingCenters(false);
    }
  }, [addToast, selectedCenter]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  // Fetch Pricing for selected center
  const fetchPricing = useCallback(async (centerUid: string) => {
    if (!centerUid) {
      setPricingOptions([]);
      return;
    }
    setPriceLoading(true);
    try {
      const pricingRes = await getPricingByCenter(centerUid);
      const pricingList = Array.isArray(pricingRes?.data) ? pricingRes.data : [];
      setPricingOptions(pricingList);
    } catch (e: any) {
      console.warn("Pricing fetch warning:", e);
      setPricingOptions([]);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  // Fetch Companies for selected center
  const fetchCompanies = useCallback(
    async (centerUid: string, category: string, pricings: Pricing[]) => {
      if (!centerUid) {
        setCompanies([]);
        return;
      }
      setCompanyLoading(true);
      try {
        const companiesRes = await getCompanies(centerUid, 1, 100);
        const companyList = Array.isArray(companiesRes?.data) ? companiesRes.data : [];

        const normalizedCategory = (category || "").toUpperCase();
        const matchingPricing = pricings.filter((p) => {
          const cats = Array.isArray(p.category) ? p.category : [p.category || ""];
          return cats.some((cat) => String(cat || "").toUpperCase() === normalizedCategory);
        });

        const matchingPricingIds = matchingPricing.map((p) => p.id);

        const filtered = companyList.filter((c) => {
          const cats = Array.isArray(c.category) ? c.category : [c.category || ""];
          if (matchingPricingIds.length === 0) return true;
          return cats.some((cat) => matchingPricingIds.includes(String(cat || "")));
        });

        setCompanies(filtered.length > 0 ? filtered : companyList);
      } catch (e: any) {
        console.warn("Company fetch warning:", e);
        setCompanies([]);
      } finally {
        setCompanyLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedCenter) {
      fetchPricing(selectedCenter);
    }
  }, [selectedCenter, fetchPricing]);

  useEffect(() => {
    if (selectedCenter) {
      fetchCompanies(selectedCenter, formData.category, pricingOptions);
    }
  }, [selectedCenter, formData.category, pricingOptions, fetchCompanies]);

  const handleCenterChange = (centerUid: string) => {
    setSelectedCenter(centerUid);
    setSelectedCompany(null);

    const chosen = centers.find((c) => (c.uid || c.id) === centerUid);
    setFormData((prev) => ({
      ...prev,
      center: centerUid,
      pricing: [],
      state: chosen?.state || prev.state,
      city: chosen?.lga || prev.city,
    }));

    if (errors.center) {
      setErrors((prev) => {
        const clone = { ...prev };
        delete clone.center;
        return clone;
      });
    }
  };

  const selectedCenterDetails = useMemo(() => {
    return centers.find((c) => (c.uid || c.id) === selectedCenter) || null;
  }, [centers, selectedCenter]);

  const statesList = useMemo(() => {
    return Object.keys(statesData || {}).sort();
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
      if (field === "type") {
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

  const filteredPricingList = useMemo(() => {
    const normalizedType = (formData.type || "").toUpperCase();
    const matched = pricingOptions.filter((p) => {
      const type = (p?.type || "").toUpperCase();
      return type === normalizedType;
    });
    return matched.length > 0 ? matched : pricingOptions;
  }, [formData.type, pricingOptions]);

  // Step Validations
  const validateStep = (stepNumber: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!selectedCenter) errs.center = "Please select a revenue center";
      if (!formData.type) errs.type = "Please select entity classification";
      if (!formData.category) errs.category = "Please select an entity category";
    }

    if (stepNumber === 2) {
      if (!formData.fullname || formData.fullname.trim().length < 3) {
        errs.fullname = "Contact person / proprietor name must be at least 3 characters";
      }
      if (formData.type === "BUSINESS" && (!formData.businessName || formData.businessName.trim().length < 2)) {
        errs.businessName = "Registered business / enterprise name is required";
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.email = "Please provide a valid email address";
      }
      const cleanPhone = formData.phone.replace(/[^0-9+]/g, "");
      if (!formData.phone || cleanPhone.length < 10) {
        errs.phone = "Phone number must contain at least 10 digits";
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
      if (!formData.city) errs.city = "Please select LGA";
      if (!formData.address || formData.address.trim().length < 5) {
        errs.address = "Detailed street / premises address is required";
      }
    }

    if (stepNumber === 6) {
      for (let s = 1; s <= 5; s++) {
        if (!validateStep(s)) return false;
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = Object.values(errs)[0];
      addToast("error", first);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if not on the final review step
    if (currentStep < STEPS.length) {
      handleNext();
      return;
    }

    // Verify all steps before saving
    for (let s = 1; s <= STEPS.length; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        fullname: formData.fullname.trim(),
        businessName: formData.type === "BUSINESS" ? formData.businessName.trim() : (formData.businessName.trim() || undefined),
        center: selectedCenter,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        type: formData.type,
        category: formData.category as any,
        zone: formData.zone || "A",
        billingFrequency: formData.billingFrequency,
        pricing: Array.from(new Set(formData.pricing)),
        company: selectedCompany?.uid || undefined,
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

      const res = await createMember(payload as Member);

      if (!res?.ok && !res?.member) {
        throw new Error(res?.message || res?.error || "Failed to create entity");
      }

      const entityData = res.member || res.data || payload;
      setRegisteredEntity(entityData);
      addToast("success", "Entity created successfully!");
    } catch (err: any) {
      console.error("Entity creation error:", err);
      addToast("error", err?.message || "Failed to create entity. Please try again.");
    } finally {
      setSaving(false);
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
      fullname: "",
      businessName: "",
      email: "",
      phone: "",
      type: "BUSINESS",
      category: "SHOP AND KIOSK ZONE A & B",
      zone: "A",
      billingFrequency: "MONTHLY",
      center: selectedCenter,
      state: selectedCenterDetails?.state || "Abuja",
      city: selectedCenterDetails?.lga || "Abuja Municipal Area Council",
      address: "",
      nearestBusStop: "",
      zipcode: "",
      pricing: [],
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
    setSelectedCompany(null);
    setErrors({});
  };

  // =========================================================================
  // SUCCESS SCREEN
  // =========================================================================
  if (registeredEntity) {
    const entityUid = registeredEntity.uid || registeredEntity.id || "MEB-SUCCESS";
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 md:p-10 shadow-sm text-center max-w-3xl mx-auto">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
            <CheckCircle size={44} />
          </div>

          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Sparkles size={14} /> IT Registration Complete
          </span>

          <h1 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
            Entity Added to Municipal Registry
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            The new member entity and registered premises have been created under{" "}
            <span className="font-semibold text-slate-800">
              {selectedCenterDetails?.center || selectedCenterDetails?.adminName || selectedCenter}
            </span>
            .
          </p>

          <div className="mt-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Assigned Entity ID (Taxpayer UID)
            </p>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="font-mono text-2xl md:text-3xl font-bold text-emerald-950">
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

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left text-xs divide-y divide-slate-200">
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Revenue Center:</span>
              <span className="font-semibold text-slate-800">
                {selectedCenterDetails?.center || selectedCenterDetails?.adminName || selectedCenter}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Business / Entity:</span>
              <span className="font-semibold text-slate-800">
                {registeredEntity.businessName || registeredEntity.fullname}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Contact Person:</span>
              <span className="font-semibold text-slate-800">{registeredEntity.fullname}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Document ({formData.document.type.toUpperCase()}):</span>
              <span className="font-semibold text-slate-800">{formData.document.number}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Property:</span>
              <span className="font-semibold text-slate-800">
                {formData.property.name} &bull; {formData.property.type} ({formData.property.size})
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Email & Phone:</span>
              <span className="font-semibold text-slate-800">{registeredEntity.email} &bull; {registeredEntity.phone}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Classification:</span>
              <span className="font-semibold text-slate-800">
                {registeredEntity.type} &bull; {formData.category} &bull; Zone {formData.zone}
              </span>
            </div>
            {selectedCompany && (
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Assigned Partner:</span>
                <span className="font-semibold text-emerald-800">{selectedCompany.name}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/it/entities/${entityUid}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <ExternalLink size={16} />
              View Entity Details
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Plus size={16} />
              Add Another Entity
            </button>
            <Link
              href="/it/entities"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-800 transition"
            >
              Back to Entities List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex items-center gap-4">
          <Link
            href="/it/entities"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
          >
            <ArrowLeft size={16} />
            Back to Entities
          </Link>
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
          Add New Entity (IT Administration)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Global entity registration across all revenue centers with statutory document & property premise tracking
        </p>
      </div>

      {/* Stepper Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:p-6">
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

      {/* Wizard Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
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
                  Choose the supervising revenue center, entity constitution, and rating zone.
                </p>
              </div>

              {/* Revenue Center Selector with appearance-none */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Select Revenue Center *
                </label>
                {loadingCenters ? (
                  <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                ) : (
                  <div className="relative">
                    <select
                      value={selectedCenter}
                      onChange={(e) => handleCenterChange(e.target.value)}
                      className={`appearance-none w-full rounded-xl border bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
                        errors.center ? "border-red-400" : "border-slate-300"
                      }`}
                    >
                      <option value="">Select Revenue Center</option>
                      {centers.map((c) => (
                        <option key={c.uid || c.id} value={c.uid || c.id}>
                          {c.center || c.adminName || c.email} ({c.uid || c.id}) {c.lga ? `• ${c.lga}` : ""}
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
                {selectedCenterDetails && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Jurisdiction: {selectedCenterDetails.lga || "Abuja Municipal"}, {selectedCenterDetails.state || "Abuja"} &bull; Prefix: {selectedCenterDetails.prefix || "AMAC"}
                  </p>
                )}
              </div>

              {/* Entity Type Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-800">
                  Entity Type *
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
                        name="itEntityType"
                        checked={formData.type === "BUSINESS"}
                        onChange={() => handleInputChange("type", "BUSINESS")}
                        className="h-4 w-4 text-emerald-600 accent-emerald-600 mt-1"
                      />
                    </div>
                    <h3 className="mt-3 font-bold text-slate-900 text-base">
                      Business / Enterprise
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Commercial establishments, shops, hotels, banks, markets, filling stations, and corporations.
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
                        name="itEntityType"
                        checked={formData.type === "INDIVIDUAL"}
                        onChange={() => handleInputChange("type", "INDIVIDUAL")}
                        className="h-4 w-4 text-emerald-600 accent-emerald-600 mt-1"
                      />
                    </div>
                    <h3 className="mt-3 font-bold text-slate-900 text-base">
                      Individual / Property Owner
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Private property landlords, residential tenants, sole traders, and individual rate-payers.
                    </p>
                  </div>
                </div>
                {errors.type && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.type}
                  </p>
                )}
              </div>

              {/* Category & Rating Zone with appearance-none */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Entity Category *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="" hidden>-- Select Category --</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label} ({cat.group})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  </div>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Rating Zone
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

          {/* STEP 2: Entity Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 2: Entity & Contact Details
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Provide primary contact credentials, business trade name, and billing schedule.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className={formData.type === "INDIVIDUAL" ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    {formData.type === "BUSINESS" ? "Contact Person / Proprietor Name *" : "Full Legal Name *"}
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="e.g., John Doe"
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
                        placeholder="e.g., Acme Synergy Ltd"
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
                      placeholder="e.g., entity@example.com"
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
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="tel"
                      placeholder="e.g., 08012345678"
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
                    Billing / Assessment Schedule
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
                  Record official taxpayer registration document credentials.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  {formData.type === "BUSINESS" ? (
                    <p>
                      <strong>Business Requirement:</strong> Commercial entities must provide their registered <strong>Corporate Affairs Commission (CAC)</strong> RC or BN Number.
                    </p>
                  ) : (
                    <p>
                      <strong>Individual Requirement:</strong> Individual taxpayers may supply their <strong>National Identity Number (NIN)</strong>, International Passport, Voter&apos;s Card, or Driver&apos;s License.
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
                      ? "CAC Registration Number (RC/BN) *"
                      : "Document Identification Number *"}
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
                  Specify physical premises attributes and upload photographs saved to Cloudinary.
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
                    placeholder="e.g., Suite 4A Unity Plaza"
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
                    placeholder="e.g., 250 sqm, 1 Shop"
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

              {/* Cloudinary Image Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-800">
                    Premises Photographs (Cloudinary)
                  </label>
                  <span className="text-xs text-slate-500">
                    {formData.property.images.length} photo(s) uploaded
                  </span>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition">
                  <UploadCloud className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-800">
                    Upload Property Evidence
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Images are automatically uploaded and hosted on Cloudinary.
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
                        Browse & Upload Photos
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

          {/* STEP 5: Partner & Location */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 5: Partner & Premises Location
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Assign an authorized collection partner company (if any) and premises location.
                </p>
              </div>

              {/* Partner Company Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-800">
                    Partner / Collection Agent Company
                  </label>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedCompany ? `Assigned: ${selectedCompany.name}` : "Direct Municipal Collection"}
                  </span>
                </div>

                {companyLoading ? (
                  <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ) : companies.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCompany(null)}
                      className={`rounded-xl border p-3 text-left transition ${
                        !selectedCompany
                          ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-200"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-semibold text-xs text-slate-900">Direct Municipal</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">No intermediary partner</p>
                    </button>

                    {companies.map((c) => {
                      const isSelected = selectedCompany?.uid === c.uid;
                      return (
                        <button
                          key={c.uid || c.id}
                          type="button"
                          onClick={() => setSelectedCompany(c)}
                          className={`rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-200"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs text-slate-900 truncate">
                              {c.name}
                            </p>
                            {isSelected && <Check size={14} className="text-emerald-700" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {c.email || c.phone || c.uid}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                    No partner company associated with this category in this center. The entity will be directly registered under council management.
                  </div>
                )}
              </div>

              {/* State & LGA with appearance-none */}
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
                    Detailed Premises Address *
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
                    placeholder="e.g., Opp. National Assembly, Federal Secretariat Junction"
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
                  Step 6: Tariffs & Summary Review
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Assign initial revenue heads for {selectedCenterDetails?.center || selectedCenterDetails?.adminName || "the selected center"} and verify details.
                </p>
              </div>

              {/* Pricing Plans */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-800">
                    Applicable Tariffs / Revenue Heads ({pricingOptions.length} available)
                  </label>
                  <span className="text-xs text-slate-500">
                    {formData.pricing.length} selected
                  </span>
                </div>

                {priceLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : filteredPricingList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {filteredPricingList.map((item) => {
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
                                {item.title}
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
                    No active tariffs match this category for this center. Tariffs can be assigned or managed after registration.
                  </div>
                )}
              </div>

              {/* Review Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Entity Registration Summary
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
                      {selectedCenterDetails?.center || selectedCenterDetails?.adminName || selectedCenter}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Contact Name</span>
                    <span className="font-semibold text-slate-900">{formData.fullname || "—"}</span>
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
                    <span className="text-slate-500 block">Email Address</span>
                    <span className="font-semibold text-slate-900">{formData.email || "—"}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Phone</span>
                    <span className="font-semibold text-slate-900">{formData.phone || "—"}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Category & Zone</span>
                    <span className="font-semibold text-slate-900">
                      {formData.category} (Zone {formData.zone})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Billing Schedule</span>
                    <span className="font-semibold text-slate-900">{formData.billingFrequency}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">Premises Address</span>
                    <span className="font-semibold text-slate-900">
                      {formData.address ? `${formData.address}, ${formData.city}, ${formData.state}` : "—"}
                    </span>
                  </div>

                  {selectedCompany && (
                    <div>
                      <span className="text-slate-500 block">Collection Partner</span>
                      <span className="font-semibold text-emerald-700">{selectedCompany.name}</span>
                    </div>
                  )}
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
                href="/it/entities"
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
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Creating Entity...
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
  );
}

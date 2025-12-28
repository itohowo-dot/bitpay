"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  
  AlertCircle,
  Shield,
  BarChart3,
  FileText,
  Plus
} from "lucide-react";
import walletService from "@/lib/wallet/wallet-service";
import { useTreasuryFeeBps, useTotalFeesCollected, useBitPayRead } from "@/hooks/use-bitpay-read";
import { microToDisplay, CONTRACT_NAMES } from "@/lib/contracts/config";
import { principalCV } from "@stacks/transactions";
import { AccessControlPanel } from "@/components/dashboard/AccessControlPanel";
import { useBlockHeight } from "@/hooks/use-block-height";
import {
  useMultiSigConfig,
  useIsMultiSigAdmin,
  useAdminCount,
  useApproveWithdrawal,
  useExecuteWithdrawal,
  useProposeAddAdmin,
  useProposeRemoveAdmin,
} from "@/hooks/use-multisig-treasury";
import { ProposalCard } from "@/components/dashboard/treasury/proposals/ProposalCard";
import { ProposeWithdrawalModal } from "@/components/dashboard/modals/ProposeWithdrawalModal";
import { MultiSigAdminList } from "@/components/dashboard/treasury/multisig/MultiSigAdminList";
import { TreasuryHeader } from "@/components/dashboard/treasury/overview/TreasuryHeader";
import { TreasuryStats } from "@/components/dashboard/treasury/overview/TreasuryStats";
import { TreasuryOverviewCard } from "@/components/dashboard/treasury/overview/TreasuryOverviewCard";
import { MultiSigConfigCard } from "@/components/dashboard/treasury/multisig/MultiSigConfigCard";
import { WithdrawFeesModal } from "@/components/dashboard/modals/WithdrawFeesModal";
import { ProposeAdminModal } from "@/components/dashboard/modals/ProposeAdminModal";
import { toast } from "sonner";

export default function TreasuryPage() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProposeWithdrawalModal, setShowProposeWithdrawalModal] = useState(false);
  const [showWithdrawFeesModal, setShowWithdrawFeesModal] = useState(false);
  const [showProposeAdminModal, setShowProposeAdminModal] = useState(false);

  // Mock proposals data (will be fetched from contract after deployment)
  const [mockProposals] = useState<any[]>([
    // Example structure for when data is available:
    // {
    //   id: 1,
    //   proposer: "SP1...",
    //   amount: BigInt(50000000), // 0.5 sBTC
    //   recipient: "SP2...",
    //   approvals: ["SP1...", "SP2..."],
    //   executed: false,
    //   proposedAt: 100000,
    //   expiresAt: 101008,
    //   description: "Monthly operations budget"
    // }
  ]);

  // Read treasury data
  const { data: feeBps } = useTreasuryFeeBps();
  const { data: totalFees } = useTotalFeesCollected();
  const { data: treasuryBalance } = useBitPayRead(
    CONTRACT_NAMES.TREASURY,
    'get-treasury-balance'
  );

  // Multi-sig data
  const { blockHeight } = useBlockHeight(30000);
  const { data: multiSigConfig } = useMultiSigConfig();
  const { data: isMultiSigAdmin } = useIsMultiSigAdmin(userAddress);
  const { data: adminCount } = useAdminCount();
  const { approve: approveProposal, isLoading: isApproving } = useApproveWithdrawal();
  const { execute: executeProposal, isLoading: isExecuting } = useExecuteWithdrawal();
  const { proposeAdd: proposeAddAdmin } = useProposeAddAdmin();
  const { proposeRemove: proposeRemoveAdmin } = useProposeRemoveAdmin();

  // Check if user is admin (legacy)
  const { data: isAdminData } = useBitPayRead(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'is-admin',
    userAddress ? [principalCV(userAddress)] : [],
    !!userAddress
  );

  useEffect(() => {
    const loadWallet = async () => {
      const address = await walletService.getCurrentAddress();
      setUserAddress(address);
    };
    loadWallet();
  }, []);

  useEffect(() => {
    if (isAdminData !== null && isAdminData !== undefined) {
      setIsAdmin(!!isAdminData);
    }
  }, [isAdminData]);

  const handleApprove = async (proposalId: number) => {
    const txId = await approveProposal(proposalId);
    if (txId) {
      toast.success("Proposal Approved!", {
        description: `Your approval has been recorded`,
      });
    }
  };

  const handleExecute = async (proposalId: number) => {
    const txId = await executeProposal(proposalId);
    if (txId) {
      toast.success("Withdrawal Executed!", {
        description: "Funds have been transferred",
      });
    }
  };

  const handleProposeAddAdmin = async () => {
    setShowProposeAdminModal(true);
  };

  const handleProposeRemoveAdmin = async (address: string) => {
    setShowProposeAdminModal(true);
  };

  // Helper function to safely extract numeric values from contract responses
  const extractValue = (data: any): any => {
    if (data === null || data === undefined) return null;
    
    // Deep extraction - handle nested {type, value} structures
    let current = data;
    while (current && typeof current === 'object' && 'value' in current) {
      current = current.value;
    }
    
    return current;
  };

  const currentFeePercent = feeBps ? Number(extractValue(feeBps)) / 100 : 0;
  
  // Extract bigint value from cvToJSON result if needed
  const getTreasuryBalanceValue = (): string => {
    try {
      const value = extractValue(treasuryBalance);
      if (!value && value !== 0) return "0.000000";
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value.toString());
      return microToDisplay(bigintValue);
    } catch (error) {
      console.error('Error extracting treasury balance:', error, treasuryBalance);
      return "0.000000";
    }
  };
  
  const getTotalFeesValue = (): string => {
    try {
      const value = extractValue(totalFees);
      if (!value && value !== 0) return "0.000000";
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value.toString());
      return microToDisplay(bigintValue);
    } catch (error) {
      console.error('Error extracting total fees:', error, totalFees);
      return "0.000000";
    }
  };
  
  const getAdminCountValue = (): number => {
    try {
      const value = extractValue(adminCount);
      if (!value && value !== 0) return 1;
      const numValue = typeof value === 'number' ? value : Number(value.toString());
      return isNaN(numValue) ? 1 : numValue;
    } catch (error) {
      console.error('Error extracting admin count:', error, adminCount);
      return 1;
    }
  };
  
  const treasuryBalanceDisplay = getTreasuryBalanceValue();

  // Mock admin list (will be fetched from contract)
  const mockAdmins = [
    { address: userAddress || "", isActive: true },
    { address: "", isActive: false },
    { address: "", isActive: false },
    { address: "", isActive: false },
    { address: "", isActive: false },
  ];

  if (!userAddress) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-yellow-500 mr-3" />
        <p className="text-muted-foreground">Please connect your wallet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TreasuryHeader
        isMultiSigAdmin={!!isMultiSigAdmin}
        isLegacyAdmin={isAdmin}
      />

      <TreasuryStats
        balance={String(treasuryBalanceDisplay || "0.000000")}
        totalFees={String(getTotalFeesValue() || "0.000000")}
        adminCount={Number(getAdminCountValue() || 1)}
        pendingProposals={Number(mockProposals.filter(p => !p.executed).length || 0)}
      />

      {/* Withdraw Fees Button - Only for admins */}
      {(isAdmin || isMultiSigAdmin) && parseFloat(treasuryBalanceDisplay) > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Withdraw Treasury Fees</h3>
                <p className="text-sm text-muted-foreground">
                  Available balance: {treasuryBalanceDisplay} sBTC
                </p>
              </div>
              <Button
                onClick={() => setShowWithdrawFeesModal(true)}
                className="bg-brand-pink hover:bg-brand-pink/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Withdraw Fees
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="proposals" className="space-y-6">
        <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="proposals"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            <FileText className="h-4 w-4 mr-2" />
            Proposals ({mockProposals.length})
          </TabsTrigger>
          <TabsTrigger
            value="multisig"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            <Shield className="h-4 w-4 mr-2" />
            Multi-Sig ({getAdminCountValue()}/5)
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          {/* TODO: Uncomment after deployment for role-based access */}
          {/* {isAdmin && ( */}
            <TabsTrigger
              value="access-control"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
            >
              <Shield className="h-4 w-4 mr-2" />
              Access Control
            </TabsTrigger>
          {/* )} */}
        </TabsList>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Withdrawal Proposals</CardTitle>
                  <CardDescription>
                    3-of-5 multi-sig • 24h timelock (144 blocks) • 100 sBTC daily limit
                  </CardDescription>
                </div>
                {/* TODO: Uncomment after deployment for role-based access */}
                {/* {isMultiSigAdmin && ( */}
                  <Button
                    onClick={() => setShowProposeWithdrawalModal(true)}
                    className="bg-brand-pink hover:bg-brand-pink/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Proposal
                  </Button>
                {/* )} */}
              </div>
            </CardHeader>
            <CardContent>
              {mockProposals.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {/* TODO: Uncomment after deployment for role-based access */}
                    {/* {isMultiSigAdmin
                      ? "Create your first withdrawal proposal to get started"
                      : "No withdrawal proposals have been created yet"} */}
                    Create your first withdrawal proposal to get started
                  </p>
                  {/* TODO: Uncomment after deployment for role-based access */}
                  {/* {isMultiSigAdmin && ( */}
                    <Button
                      onClick={() => setShowProposeWithdrawalModal(true)}
                      className="bg-brand-pink hover:bg-brand-pink/90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Proposal
                    </Button>
                  {/* )} */}
                </div>
              ) : (
                <div className="space-y-4">
                  {mockProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      currentBlock={blockHeight}
                      userAddress={userAddress}
                      isUserAdmin={!!isMultiSigAdmin}
                      onApprove={handleApprove}
                      onExecute={handleExecute}
                      isApproving={isApproving}
                      isExecuting={isExecuting}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Sig Tab */}
        <TabsContent value="multisig" className="space-y-6">
          {/* TODO: Uncomment after deployment for role-based access: isCurrentUserAdmin={!!isMultiSigAdmin} */}
          <MultiSigAdminList
            admins={mockAdmins}
            totalSlots={5}
            requiredSignatures={3}
            currentUserAddress={userAddress}
            isCurrentUserAdmin={true}
            onProposeAdd={handleProposeAddAdmin}
            onProposeRemove={handleProposeRemoveAdmin}
          />

          {multiSigConfig && <MultiSigConfigCard config={multiSigConfig} />}
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <TreasuryOverviewCard
            feeRate={Number(currentFeePercent || 0)}
            balance={String(treasuryBalanceDisplay || "0.000000")}
            totalFees={String(getTotalFeesValue() || "0.000000")}
            adminCount={Number(getAdminCountValue() || 1)}
          />
        </TabsContent>

        {/* Access Control Tab */}
        {/* TODO: Uncomment after deployment for role-based access */}
        {/* {isAdmin && ( */}
          <TabsContent value="access-control">
            <AccessControlPanel />
          </TabsContent>
        {/* )} */}
      </Tabs>

      {/* Modals */}
      <ProposeWithdrawalModal
        isOpen={showProposeWithdrawalModal}
        onClose={() => setShowProposeWithdrawalModal(false)}
        treasuryBalance={treasuryBalanceDisplay}
        onSuccess={() => {
          // Refetch proposals
          toast.success("Proposal created successfully!");
        }}
      />

      <WithdrawFeesModal
        isOpen={showWithdrawFeesModal}
        onClose={() => setShowWithdrawFeesModal(false)}
        totalFeesAvailable={treasuryBalanceDisplay}
        onSuccess={() => {
          // Refetch treasury balance
          toast.success("Fees withdrawn successfully!");
        }}
      />

      <ProposeAdminModal
        isOpen={showProposeAdminModal}
        onClose={() => setShowProposeAdminModal(false)}
        currentAdminCount={getAdminCountValue()}
        onSuccess={() => {
          // Refetch admin list
          toast.success("Admin proposal created!");
        }}
      />
    </div>
  );
}

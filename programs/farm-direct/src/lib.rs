// programs/farm-direct/src/lib.rs
use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

declare_id!("FarmDirect11111111111111111111111111111111");

#[program]
pub mod farm_direct {
    use super::*;

    // Inicjalizacja profilu rolnika
    pub fn initialize_farmer(
        ctx: Context<InitializeFarmer>,
        encrypted_data: String,        // Zaszyfrowane wrażliwe dane
        public_name: String,
        region: String,               // Województwo/powiat
        certifications: Vec<String>,
    ) -> Result<()> {
        let farmer_profile = &mut ctx.accounts.farmer_profile;
        let clock = Clock::get()?;

        farmer_profile.farmer_wallet = ctx.accounts.farmer.key();
        farmer_profile.encrypted_data = encrypted_data;
        farmer_profile.public_name = public_name;
        farmer_profile.region = region;
        farmer_profile.certifications = certifications;
        farmer_profile.verification_status = false;
        farmer_profile.reputation_score = 0;
        farmer_profile.total_products = 0;
        farmer_profile.created_at = clock.unix_timestamp;
        farmer_profile.updated_at = clock.unix_timestamp;

        Ok(())
    }

    // Aktualizacja profilu rolnika
    pub fn update_farmer_profile(
        ctx: Context<UpdateFarmerProfile>,
        encrypted_data: Option<String>,
        public_name: Option<String>,
        region: Option<String>,
        certifications: Option<Vec<String>>,
    ) -> Result<()> {
        let farmer_profile = &mut ctx.accounts.farmer_profile;
        let clock = Clock::get()?;

        if let Some(data) = encrypted_data {
            farmer_profile.encrypted_data = data;
        }
        if let Some(name) = public_name {
            farmer_profile.public_name = name;
        }
        if let Some(reg) = region {
            farmer_profile.region = reg;
        }
        if let Some(certs) = certifications {
            farmer_profile.certifications = certs;
        }

        farmer_profile.updated_at = clock.unix_timestamp;

        Ok(())
    }

    // Tworzenie nowego produktu
    pub fn create_product(
        ctx: Context<CreateProduct>,
        product_name: String,
        category: String,
        description: String,
        estimated_harvest_date: i64,
        estimated_quantity: u64,
        firebase_image_urls: Vec<String>,
    ) -> Result<()> {
        let product_cycle = &mut ctx.accounts.product_cycle;
        let farmer_profile = &mut ctx.accounts.farmer_profile;
        let clock = Clock::get()?;

        product_cycle.product_id = hash(&[
            ctx.accounts.farmer.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
        ]).to_string();
        
        product_cycle.farmer = ctx.accounts.farmer.key();
        product_cycle.product_name = product_name;
        product_cycle.category = category;
        product_cycle.description = description;
        product_cycle.estimated_harvest_date = estimated_harvest_date;
        product_cycle.estimated_quantity = estimated_quantity;
        product_cycle.actual_quantity = 0;
        product_cycle.firebase_image_urls = firebase_image_urls;
        product_cycle.growth_updates = Vec::new();
        product_cycle.delivery_updates = Vec::new();
        product_cycle.created_at = clock.unix_timestamp;
        product_cycle.updated_at = clock.unix_timestamp;

        // Zwiększ licznik produktów u rolnika
        farmer_profile.total_products += 1;
        farmer_profile.updated_at = clock.unix_timestamp;

        Ok(())
    }

    // Dodanie aktualizacji wzrostu produktu
    pub fn add_growth_update(
        ctx: Context<UpdateProduct>,
        stage: GrowthStage,
        notes: String,
        firebase_image_urls: Vec<String>,
    ) -> Result<()> {
        let product_cycle = &mut ctx.accounts.product_cycle;
        let clock = Clock::get()?;

        let growth_update = GrowthUpdate {
            stage,
            timestamp: clock.unix_timestamp,
            notes,
            firebase_image_urls,
        };

        product_cycle.growth_updates.push(growth_update);
        product_cycle.updated_at = clock.unix_timestamp;

        Ok(())
    }

    // Aktualizacja rzeczywistej ilości po zbiorach
    pub fn update_actual_quantity(
        ctx: Context<UpdateProduct>,
        actual_quantity: u64,
    ) -> Result<()> {
        let product_cycle = &mut ctx.accounts.product_cycle;
        let clock = Clock::get()?;

        product_cycle.actual_quantity = actual_quantity;
        product_cycle.updated_at = clock.unix_timestamp;

        Ok(())
    }

    // Aktualizacja statusu dostawy
    pub fn add_delivery_update(
        ctx: Context<UpdateProduct>,
        status: DeliveryStatus,
        notes: String,
        location: Option<String>,
    ) -> Result<()> {
        let product_cycle = &mut ctx.accounts.product_cycle;
        let clock = Clock::get()?;

        let delivery_update = DeliveryUpdate {
            status,
            timestamp: clock.unix_timestamp,
            notes,
            location,
        };

        product_cycle.delivery_updates.push(delivery_update);
        product_cycle.updated_at = clock.unix_timestamp;

        Ok(())
    }

    // Inicjalizacja kampanii crowdfundingowej
    pub fn create_crowdfunding_campaign(
        ctx: Context<CreateCrowdfundingCampaign>,
        title: String,
        description: String,
        goal_amount: u64,
        deadline: i64,
        campaign_type: CampaignType,
        milestones: Vec<String>,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        campaign.campaign_id = hash(&[
            ctx.accounts.farmer.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
        ]).to_string();
        
        campaign.farmer = ctx.accounts.farmer.key();
        campaign.title = title;
        campaign.description = description;
        campaign.goal_amount = goal_amount;
        campaign.current_amount = 0;
        campaign.deadline = deadline;
        campaign.campaign_type = campaign_type;
        campaign.milestones = milestones;
        campaign.contributors = Vec::new();
        campaign.is_active = true;
        campaign.created_at = clock.unix_timestamp;
        campaign.updated_at = clock.unix_timestamp;

        Ok(())
    }

    // Wpłata na kampanię crowdfundingową
    pub fn contribute_to_campaign(
        ctx: Context<ContributeToCampaign>,
        amount: u64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        // Transfer SOL
        let ix = anchor_lang::system_program::Transfer {
            from: ctx.accounts.contributor.to_account_info(),
            to: ctx.accounts.campaign_vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            ix,
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        // Dodaj kontrybutora
        let contributor = Contributor {
            wallet: ctx.accounts.contributor.key(),
            amount,
            timestamp: clock.unix_timestamp,
        };

        campaign.contributors.push(contributor);
        campaign.current_amount += amount;
        campaign.updated_at = clock.unix_timestamp;

        // Sprawdź czy cel został osiągnięty
        if campaign.current_amount >= campaign.goal_amount {
            campaign.is_active = false;
        }

        Ok(())
    }
}

// Struktury danych
#[account]
pub struct FarmerProfile {
    pub farmer_wallet: Pubkey,
    pub encrypted_data: String,      // Zaszyfrowane wrażliwe dane (email, telefon, dokładny adres)
    pub public_name: String,         // Nazwa publiczna gospodarstwa
    pub region: String,              // Województwo/powiat
    pub certifications: Vec<String>, // Certyfikaty (BIO, lokalne)
    pub verification_status: bool,   // Czy zweryfikowany
    pub reputation_score: u64,       // Reputacja
    pub total_products: u64,         // Liczba produktów
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
pub struct ProductCycle {
    pub product_id: String,
    pub farmer: Pubkey,
    pub product_name: String,
    pub category: String,
    pub description: String,
    pub estimated_harvest_date: i64,
    pub estimated_quantity: u64,
    pub actual_quantity: u64,
    pub firebase_image_urls: Vec<String>,  // URLe do zdjęć w Firebase
    pub growth_updates: Vec<GrowthUpdate>,
    pub delivery_updates: Vec<DeliveryUpdate>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
pub struct CrowdfundingCampaign {
    pub campaign_id: String,
    pub farmer: Pubkey,
    pub title: String,
    pub description: String,
    pub goal_amount: u64,            // w lamportach (SOL)
    pub current_amount: u64,
    pub deadline: i64,
    pub campaign_type: CampaignType,
    pub milestones: Vec<String>,
    pub contributors: Vec<Contributor>,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

// Struktury pomocnicze
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GrowthUpdate {
    pub stage: GrowthStage,
    pub timestamp: i64,
    pub notes: String,
    pub firebase_image_urls: Vec<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DeliveryUpdate {
    pub status: DeliveryStatus,
    pub timestamp: i64,
    pub notes: String,
    pub location: Option<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Contributor {
    pub wallet: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// Enumeracje
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum GrowthStage {
    Seeding,
    Germination,
    Growing,
    Flowering,
    Fruiting,
    Harvest,
    PostHarvest,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum DeliveryStatus {
    Preparing,
    Packed,
    InTransit,
    Delivered,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum CampaignType {
    Equipment,
    Seeds,
    Infrastructure,
    Expansion,
    Emergency,
}

// Konteksty
#[derive(Accounts)]
pub struct InitializeFarmer<'info> {
    #[account(init, payer = farmer, space = 8 + 1000)]
    pub farmer_profile: Account<'info, FarmerProfile>,
    #[account(mut)]
    pub farmer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateFarmerProfile<'info> {
    #[account(mut, has_one = farmer_wallet @ ErrorCode::UnauthorizedFarmer)]
    pub farmer_profile: Account<'info, FarmerProfile>,
    #[account(mut)]
    pub farmer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateProduct<'info> {
    #[account(init, payer = farmer, space = 8 + 2000)]
    pub product_cycle: Account<'info, ProductCycle>,
    #[account(mut, has_one = farmer_wallet @ ErrorCode::UnauthorizedFarmer)]
    pub farmer_profile: Account<'info, FarmerProfile>,
    #[account(mut)]
    pub farmer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProduct<'info> {
    #[account(mut, has_one = farmer @ ErrorCode::UnauthorizedFarmer)]
    pub product_cycle: Account<'info, ProductCycle>,
    #[account(mut)]
    pub farmer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateCrowdfundingCampaign<'info> {
    #[account(init, payer = farmer, space = 8 + 1500)]
    pub campaign: Account<'info, CrowdfundingCampaign>,
    /// CHECK: This is safe because we're just using it to receive funds
    #[account(mut)]
    pub campaign_vault: AccountInfo<'info>,
    #[account(mut)]
    pub farmer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ContributeToCampaign<'info> {
    #[account(mut)]
    pub campaign: Account<'info, CrowdfundingCampaign>,
    /// CHECK: This is safe because we're just using it to receive funds
    #[account(mut)]
    pub campaign_vault: AccountInfo<'info>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Kody błędów
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized farmer")]
    UnauthorizedFarmer,
    #[msg("Campaign is not active")]
    CampaignNotActive,
    #[msg("Campaign deadline exceeded")]
    CampaignDeadlineExceeded,
    #[msg("Invalid amount")]
    InvalidAmount,
}
from data import processing


def test_extract_orgs() -> None:
    domain_map = {
        'canada.ca': {
            'organization_name_en': 'Shared Services Canada',
            'organization_name_fr': 'Services partagés Canada',
            'organization_slug': 'shared-services-canada'
        },
        'digital.canada.ca': {
            'organization_name_en': 'Treasury Board of Canada Secretariat',
            'organization_name_fr': 'Secrétariat du Conseil du Trésor du Canada',
            'organization_slug': 'treasury-board-of-canada-secretariat',
        },
        'numerique.canada.ca': {
            'organization_name_en': 'Treasury Board of Canada Secretariat',
            'organization_name_fr': 'Secrétariat du Conseil du Trésor du Canada',
            'organization_slug': 'treasury-board-of-canada-secretariat',
        },
    }

    organizations = processing.extract_orgs(domain_map)
    assert organizations == {
        'shared-services-canada': {
            "name_en": 'Shared Services Canada',
            "name_fr": 'Services partagés Canada',
            "slug": 'shared-services-canada',
            "total_domains": 1,
        },
        'treasury-board-of-canada-secretariat': {
            "name_en": 'Treasury Board of Canada Secretariat',
            "name_fr": 'Secrétariat du Conseil du Trésor du Canada',
            "slug": 'treasury-board-of-canada-secretariat',
            "total_domains": 2,
        }
    }


def test_map_subdomains() -> None:
    owners = {
        'canada.ca': {
            'organization_slug': 'shared-services-canada',
            'organization_name_en': 'Shared Services Canada',
            'organization_name_fr': 'Services partagés Canada',
        }, 'digital.canada.ca': {
            'organization_slug': 'treasury-board-of-canada-secretariat',
            'organization_name_en': 'Treasury Board of Canada Secretariat',
            'organization_name_fr': 'Secrétariat du Conseil du Trésor du Canada',
        }, 'numerique.canada.ca':{
            'organization_slug': 'treasury-board-of-canada-secretariat',
            'organization_name_en': 'Treasury Board of Canada Secretariat',
            'organization_name_fr': 'Secrétariat du Conseil du Trésor du Canada',
        },
    }
    results = {
        'canada.ca': {
            'is_parent': True,
            'is_owner': True,
        },
        'digital.canada.ca': {
            'is_parent': True,
            'is_owner': True,
        },
        'numerique.canada.ca': {
            'is_parent': True,
            'is_owner': True,
        },
        'open.canada.ca': {
            'is_parent': False,
            'is_owner': False,
        },
        'ouvert.canada.ca': {
            'is_parent': False,
            'is_owner': False,
        },
        'somethingdifferent.ca': {
            'is_parent': False,
            'is_owner': False,
        }
    }
    processing.map_subdomains(results, owners)
    assert results == {
        'canada.ca': {
            'base_domain': 'canada.ca',
            'is_parent': True,
            'is_owner': True,
            'organization_slug': 'shared-services-canada',
            'organization_name_en': 'Shared Services Canada',
            'organization_name_fr': 'Services partagés Canada',
        },
        'digital.canada.ca': {
            'base_domain': 'digital.canada.ca',
            'is_parent': True,
            'is_owner': True,
            'organization_slug': 'treasury-board-of-canada-secretariat',
            'organization_name_en': 'Treasury Board of Canada Secretariat',
            'organization_name_fr': 'Secrétariat du Conseil du Trésor du Canada',
        },
        'numerique.canada.ca': {
            'base_domain': 'numerique.canada.ca',
            'is_parent': True,
            'is_owner': True,
            'organization_slug': 'treasury-board-of-canada-secretariat',
            'organization_name_en': 'Treasury Board of Canada Secretariat',
            'organization_name_fr': 'Secrétariat du Conseil du Trésor du Canada',
        },
        'open.canada.ca': {
            'base_domain': 'canada.ca',
            'is_owner': False,
            'is_parent': False,
            'organization_slug': 'shared-services-canada',
            'organization_name_en': 'Shared Services Canada',
            'organization_name_fr': 'Services partagés Canada',

        },
        'ouvert.canada.ca': {
            'base_domain': 'canada.ca',
            'is_owner': False,
            'is_parent': False,
            'organization_slug': 'shared-services-canada',
            'organization_name_en': 'Shared Services Canada',
            'organization_name_fr': 'Services partagés Canada',
        },
        'somethingdifferent.ca': {
            'base_domain': 'somethingdifferent.ca',
            'is_owner': False,
            'is_parent': True,
            'organization_slug': 'government-of-canada',
            'organization_name_en': 'Government of Canada',
            'organization_name_fr': 'Gouvernement du Canada',
        }
    }
